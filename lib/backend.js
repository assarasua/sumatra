import Stripe from 'stripe';
import {quote,validateBooking,eventState} from './payment.js';
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
function stripeFor(env){
 if(!env.STRIPE_SECRET_KEY?.startsWith('sk_test_'))throw new Error('Test payments are not configured.');
 return new Stripe(env.STRIPE_SECRET_KEY,{httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:2});
}
async function body(request){
 if(Number(request.headers.get('Content-Length')||0)>8192)throw new Error('Request is too large.');
 const raw=await request.text();if(raw.length>8192)throw new Error('Request is too large.');return JSON.parse(raw);
}
function originAllowed(request){return request.headers.get('Origin')===new URL(request.url).origin;}
async function rateLimit(request,env){
 const ip=request.headers.get('cf-connecting-ip')||'local';const minute=Math.floor(Date.now()/60000);
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
 const id=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')+':'+minute;
 const row=await env.DB.prepare('INSERT INTO checkout_attempts(id,count,expires_at) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(id,(minute+2)*60).first();
 return row.count<=8;
}
async function checkout(request,env){
 if(!originAllowed(request))return json({error:'Open checkout from this website.'},403);
 if(!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'))return json({error:'Payments are being configured. Please contact us on WhatsApp.'},503);
 if(!await rateLimit(request,env))return json({error:'Please wait a minute before trying again.'},429);
 const b=await body(request),price=validateBooking(b),stripe=stripeFor(env);
 let existing=await env.DB.prepare('SELECT * FROM bookings WHERE id=?').bind(b.id).first();
 if(existing){
  if(existing.tour!==b.tour||existing.departure!==b.departure||existing.travellers!==b.travellers||existing.email!==b.email.trim())return json({error:'Please start a new checkout for changed booking details.'},409);
  if(existing.checkout_id){const prior=await stripe.checkout.sessions.retrieve(existing.checkout_id);if(prior.status==='expired')return json({error:'This checkout expired. Please change your booking details to start again.'},409);}
  if(existing.status==='paid')return json({error:'This booking has already been paid.'},409);
 }else{
  await env.DB.prepare('INSERT INTO bookings(id,tour,departure,travellers,name,email,amount,status,created_at) VALUES(?,?,?,?,?,?,?, ?,?)').bind(b.id,b.tour,b.departure,b.travellers,b.name.trim(),b.email.trim(),price.total,'creating',Math.floor(Date.now()/1000)).run();
 }
 const tax=env.STRIPE_TAX_ENABLED==='true';
 if(tax&&!env.STRIPE_TAX_CODE)throw new Error('Tax classification is not configured.');
 const origin=new URL(request.url).origin;
 const params={mode:'payment',customer_creation:'always',customer_email:b.email.trim(),client_reference_id:b.id,
  line_items:[{price_data:{currency:'eur',unit_amount:price.unit,tax_behavior:'inclusive',product_data:{name:price.title,...(tax?{tax_code:env.STRIPE_TAX_CODE}:{})}},quantity:b.travellers}],
  invoice_creation:{enabled:true,invoice_data:{metadata:{booking_id:b.id,tour:b.tour,departure:b.departure}}},
  metadata:{booking_id:b.id,tour:b.tour,departure:b.departure,travellers:String(b.travellers)},payment_intent_data:{metadata:{booking_id:b.id}},
  success_url:origin+'/payment/?booking='+b.id,cancel_url:origin+'/?lang=en#enquiry',expires_at:(existing?.created_at||Math.floor(Date.now()/1000))+1800,
  custom_text:{submit:{message:'Your payment is for the selected tour. Your preferred departure date and final travel details will be confirmed by our team.'}},
  ...(tax?{automatic_tax:{enabled:true},billing_address_collection:'required',tax_id_collection:{enabled:true}}:{})};
 const session=await stripe.checkout.sessions.create(params,{idempotencyKey:'booking:'+b.id});
 await env.DB.prepare('UPDATE bookings SET checkout_id=?,status=CASE WHEN status=\'paid\' THEN status ELSE \'pending\' END WHERE id=?').bind(session.id,b.id).run();
 return json({url:session.url,booking:b.id});
}
async function webhook(request,env){
 if(request.method!=='POST')return json({error:'Use POST.'},405);
 if(!env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'))return json({error:'Webhook is not configured.'},503);
 if(Number(request.headers.get('Content-Length')||0)>1048576)return json({error:'Payload too large.'},413);
 const raw=await request.text();if(raw.length>1048576)return json({error:'Payload too large.'},413);
 let event;
 try{event=await stripeFor(env).webhooks.constructEventAsync(raw,request.headers.get('stripe-signature')||'',env.STRIPE_WEBHOOK_SECRET,300,Stripe.createSubtleCryptoProvider());}
 catch{return json({error:'Invalid webhook signature.'},400);}
 if(event.livemode)return json({error:'This endpoint accepts test events only.'},400);
 const seen=await env.DB.prepare('SELECT id FROM stripe_events WHERE id=?').bind(event.id).first();
 if(seen)return json({received:true});
 let state=eventState(event);const o=event.data.object,booking=o.metadata?.booking_id||o.client_reference_id;
 if(state==='paid'&&booking){const row=await env.DB.prepare('SELECT amount FROM bookings WHERE id=?').bind(booking).first();const amount=event.type.startsWith('invoice.')?o.amount_paid:o.amount_total;if(row&&(o.currency!=='eur'||amount!==row.amount))return json({error:'Payment amount does not match booking.'},400);}
 const statements=[env.DB.prepare('INSERT OR IGNORE INTO stripe_events(id,type,created_at) VALUES(?,?,?)').bind(event.id,event.type,event.created)];
 if(state&&booking)statements.push(env.DB.prepare("UPDATE bookings SET status=?,event_at=? WHERE id=? AND status!='paid' AND (event_at<=? OR ?='paid')").bind(state,event.created,booking,event.created,state));
 await env.DB.batch(statements);
 return json({received:true});
}
async function status(request,env){
 const id=new URL(request.url).searchParams.get('id');if(!/^[a-f0-9-]{36}$/i.test(id||''))return json({error:'Invalid reference.'},400);
 const b=await env.DB.prepare('SELECT tour,departure,travellers,status FROM bookings WHERE id=?').bind(id).first();
 return b?json(b):json({error:'Booking not found.'},404);
}
async function invoice(request,env){
 if(!env.STRIPE_ADMIN_TOKEN||request.headers.get('Authorization')!=='Bearer '+env.STRIPE_ADMIN_TOKEN)return json({error:'Unauthorized.'},401);
 const b=await body(request);
 if(!Number.isInteger(b.amount_cents)||b.amount_cents<100||b.amount_cents>100000000)throw new Error('Use a positive agreed amount in euro cents.');
 if(typeof b.description!=='string'||!b.description.trim()||b.description.length>500)throw new Error('An agreed trip description is required.');
 const base={...b,tour:'BL-02D'};validateBooking(base);
 const stripe=stripeFor(env);const existing=await env.DB.prepare('SELECT invoice_id FROM bookings WHERE id=?').bind(b.id).first();
 if(existing?.invoice_id)return json({invoice_id:existing.invoice_id,status:'draft'});
 const tax=env.STRIPE_TAX_ENABLED==='true';if(tax&&!env.STRIPE_TAX_CODE)throw new Error('Tax classification is not configured.');
 const customer=await stripe.customers.create({name:b.name.trim(),email:b.email.trim()},{idempotencyKey:'invoice-customer:'+b.id});
 const inv=await stripe.invoices.create({customer:customer.id,collection_method:'send_invoice',days_until_due:7,auto_advance:false,metadata:{booking_id:b.id},...(tax?{automatic_tax:{enabled:true}}:{})},{idempotencyKey:'invoice:'+b.id});
 await stripe.invoiceItems.create({customer:customer.id,invoice:inv.id,description:b.description.trim(),price_data:{currency:'eur',product:await ensureCustomProduct(stripe,env),unit_amount:b.amount_cents,tax_behavior:'inclusive'},quantity:1},{idempotencyKey:'invoice-line:'+b.id});
 await env.DB.prepare('INSERT INTO bookings(id,tour,departure,travellers,name,email,amount,status,invoice_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET invoice_id=excluded.invoice_id').bind(b.id,'custom',b.departure,b.travellers,b.name.trim(),b.email.trim(),b.amount_cents,'invoice_draft',inv.id,Math.floor(Date.now()/1000)).run();
 return json({invoice_id:inv.id,status:'draft',message:'Review and finalize in Stripe Dashboard. Nothing has been emailed.'});
}
async function ensureCustomProduct(stripe,env){
 const p=await stripe.products.create({name:'Custom Sumatra journey',...(env.STRIPE_TAX_ENABLED==='true'?{tax_code:env.STRIPE_TAX_CODE}:{})},{idempotencyKey:'custom-product-v1'});return p.id;
}
export default {async fetch(request,env){
 const url=new URL(request.url);
 try{
  if(url.pathname==='/api/stripe/webhook')return await webhook(request,env);
  if(url.pathname==='/api/checkout'&&request.method==='POST')return await checkout(request,env);
  if(url.pathname==='/api/booking'&&request.method==='GET')return await status(request,env);
  if(url.pathname==='/api/admin/invoices'&&request.method==='POST')return await invoice(request,env);
  if(url.pathname.startsWith('/api/'))return json({error:'Not found.'},404);
  return json({error:'Not found.'},404);
 }catch(error){console.error('Payment endpoint failed:',error.type||error.name||'Error');return json({error:error.type?'Unable to start payment. Please try again or contact us.':error.message||'Unable to process request.'},400);}
}};
