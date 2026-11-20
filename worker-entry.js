import worker from './.open-next/worker.js';
import {drainOutbox} from './lib/booking-email.js';
export * from './.open-next/worker.js';
export default {...worker,scheduled(event,env,ctx){ctx.waitUntil(drainOutbox(env,{limit:10}));}};
