import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {actions,runAction,agentOriginAllowed} from './agent-actions.js';
import {BASE,tours,policies} from './catalog.js';
export async function handleMcp(request,env){
 if(!agentOriginAllowed(request))return Response.json({error:'Origin not allowed.'},{status:403});
 const version=request.headers.get('Poppy-Version');if(version&&version!=='1.0')return Response.json({error:'version_unsupported'},{status:400});
 const server=new McpServer({name:'Explore Sumatra Escape',version:'1.0.0'},{instructions:'Find real offered Sumatra tours, quote group prices, read travel guides, and prepare WhatsApp or Stripe checkout links. Payments remain in test mode. Dates require team confirmation. Get the customer’s explicit consent before sharing booking details. No account access or automatic payment.'});
 for(const [name,a] of Object.entries(actions))server.registerTool(name,{description:a.description,inputSchema:a.schema,annotations:{readOnlyHint:a.readOnly,destructiveHint:false,idempotentHint:true,openWorldHint:!a.readOnly}},async args=>{try{const result=await runAction(name,args,request,env);return {content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result};}catch(e){return {isError:true,content:[{type:'text',text:e.name==='ZodError'?'Invalid action arguments. Review the tool schema.':e.type?'Checkout is temporarily unavailable.':e.message}]};}});
 server.registerResource('Tour catalogue',BASE+'/agent-catalog.json',{mimeType:'application/json',description:'Offered tours, group rates and booking policies'},async uri=>({contents:[{uri:uri.href,mimeType:'application/json',text:JSON.stringify({tours,policies})}]}));
 const transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true,maxRequestBodySize:32768});
 await server.connect(transport);return await transport.handleRequest(request);
}
