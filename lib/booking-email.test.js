import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';import {drainOutbox,bookingEmail} from './booking-email.js';
test('branded email attaches the booked tour guide and escapes customer text',()=>{const b={id:crypto.randomUUID(),tour:'BL-02D',name:'<img>',email:'test@example.com',travellers:3,amount:36000,departure:'2099-01-01'};const e=bookingEmail(b);assert.match(e.html,/&lt;img&gt;/);assert.match(e.html,/€360.00/);assert.match(e.text,/615 788 239/);assert.match(e.attachments[0].path,/bl-02d.pdf$/);assert.match(e.html,/awaiting team confirmation/);assert.match(bookingEmail(b,{preview:true}).text,/No payment or reservation/);});
test('outbox retries provider failure, then records one successful delivery',async()=>{
 const db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('migrations').filter(x=>x.endsWith('.sql')).sort())db.exec(fs.readFileSync('migrations/'+f,'utf8'));
 const id=crypto.randomUUID();db.prepare('INSERT INTO bookings(id,tour,departure,travellers,name,email,amount,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,'BL-02D','2099-01-01',2,'Test','test@example.com',24000,'paid',1);db.prepare("INSERT INTO booking_emails(booking_id,state) VALUES(?,'pending')").run(id);
 const DB={prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null;},async run(){return db.prepare(sql).run(...args);}};}};}};
 const env={DB,RESEND_API_KEY:'re_unit',RESEND_FROM_EMAIL:'Test <test@example.com>'};const original=globalThis.fetch;let calls=0;
 try{globalThis.fetch=async(url,opts)=>{calls++;assert.equal(opts.headers['Idempotency-Key'],'sumatra-booking-'+id);return calls===1?new Response('{}',{status:503}):Response.json({id:'email_unit'});};
 await drainOutbox(env);assert.equal(db.prepare('SELECT state FROM booking_emails').get().state,'pending');
 db.prepare('UPDATE booking_emails SET next_attempt=0').run();await drainOutbox(env);await drainOutbox(env);assert.equal(calls,2);const row=db.prepare('SELECT * FROM booking_emails').get();assert.equal(row.state,'sent');assert.equal(row.resend_id,'email_unit');
 }finally{globalThis.fetch=original;db.close();}
});
