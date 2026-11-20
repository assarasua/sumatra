import {getCloudflareContext} from '@opennextjs/cloudflare';
import paymentWorker from '../../../lib/backend.js';
export const dynamic='force-dynamic';
async function handle(request){const {env}=await getCloudflareContext({async:true});return paymentWorker.fetch(request,env);}
export {handle as GET,handle as POST};
