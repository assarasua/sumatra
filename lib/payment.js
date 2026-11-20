export function quote(tour,travellers){
 if(!Number.isInteger(travellers)||travellers<1||travellers>8)throw new Error('Choose between 1 and 8 travellers.');
 if(tour==='BL-01D')return {unit:7000,total:7000*travellers,title:'1-Day Sumatran Orangutan Jungle Trekking'};
 if(['BL-04D','BL-05D'].includes(tour)){if(travellers<2)throw new Error('This tour requires at least 2 travellers.');const unit=tour==='BL-04D'?25000:32000;return {unit,total:unit*travellers,title:tour==='BL-04D'?'4 Days 3 Nights Jungle Trekking':'5 Days 4 Nights Jungle Trekking'};}
 if(tour==='BL-02D')return {unit:12000,total:12000*travellers,title:'2 Days 1 Night Jungle Trekking'};
 if(tour==='BL-03D'){
  if(travellers>6)throw new Error('Please request a quote for more than 6 travellers on the three-day tour.');
  const unit=travellers===1?25000:travellers===2?18000:travellers<=4?16000:15000;
  return {unit,total:unit*travellers,title:'3-Day Forest Immersion'};
 }
 throw new Error('This tour needs a confirmed quote before payment. Please contact us on WhatsApp.');
}
export function validateBooking(b){
 if(!b||typeof b!=='object')throw new Error('Invalid booking.');
 if(!/^[a-f0-9-]{36}$/i.test(b.id||''))throw new Error('Invalid booking reference.');
 if(typeof b.name!=='string'||!b.name.trim()||b.name.length>100)throw new Error('Enter your name.');
 if(typeof b.email!=='string'||b.email.length>254||!/^\S+@\S+\.\S+$/.test(b.email))throw new Error('Enter a valid email address.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(b.departure||'')||!Number.isFinite(Date.parse(b.departure))||new Date(b.departure).toISOString().slice(0,10)!==b.departure||b.departure<new Date().toISOString().slice(0,10))throw new Error('Choose a future departure date.');
 return quote(b.tour,b.travellers);
}
export function eventState(event){
 const o=event.data.object;
 if(event.type==='checkout.session.completed')return o.payment_status==='paid'?'paid':'processing';
 if(event.type==='checkout.session.async_payment_succeeded'||event.type==='invoice.paid')return 'paid';
 if(event.type==='checkout.session.async_payment_failed'||event.type==='invoice.payment_failed')return 'payment_failed';
 if(event.type==='checkout.session.expired')return 'expired';
 return null;
}
