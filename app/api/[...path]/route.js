import {getCloudflareContext} from '@opennextjs/cloudflare';
import paymentWorker from '../../../lib/backend.js';
export const dynamic='force-dynamic';
async function handle(request){const {env,ctx}=await getCloudflareContext({async:true});return paymentWorker.fetch(request,env,ctx);}
export {handle as GET,handle as POST};
