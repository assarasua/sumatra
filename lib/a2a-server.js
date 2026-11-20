import {Message} from '@a2a-js/sdk';
import {JsonRpcTransportHandler,ServerCallContext} from '@a2a-js/sdk/server';
import {UnsupportedOperationError,RequestMalformedError} from '@a2a-js/sdk/errors';
import {agentCard} from './agent-card.js';
import {runAction,readAgentBody,agentOriginAllowed} from './agent-actions.js';
const unsupported=async()=>{throw new UnsupportedOperationError('This public agent returns immediate messages and does not store tasks or private conversations.');};
export async function handleA2a(request,env){
 if(!agentOriginAllowed(request))return Response.json({error:'Origin not allowed.'},{status:403});
 if(request.headers.get('A2A-Version')!=='1.0')return Response.json({jsonrpc:'2.0',id:null,error:{code:-32009,message:'Version not supported. Send A2A-Version: 1.0.'}},{status:400});
 try{
 const handler={getAgentCard:async()=>agentCard,getAuthenticatedExtendedAgentCard:unsupported,getTask:unsupported,listTasks:unsupported,cancelTask:unsupported,sendMessageStream:unsupported,resubscribe:unsupported,createTaskPushNotificationConfig:unsupported,getTaskPushNotificationConfig:unsupported,listTaskPushNotificationConfigs:unsupported,deleteTaskPushNotificationConfig:unsupported,
 async sendMessage({message}){
  if(!message?.messageId||message.role!==1||!message.parts?.length||message.taskId)throw new RequestMalformedError('Send a user message with an ID and text or action data.');
  const structured=message.parts.find(p=>p.content?.$case==='data')?.content.value;
  const text=message.parts.filter(p=>p.content?.$case==='text').map(p=>p.content.value).join(' ');
  let result;
  try{
   if(structured)result=await runAction(structured.action,structured.arguments,request,env);
   else if(/checkout|pay|book/i.test(text))result={message:'To prepare checkout, send a data part with action create_checkout_link and arguments request_id, tour, departure, travellers, name, email and customer_consent:true. Ask the customer first. No payment is made by the agent.'};
   else if(/whatsapp|contact/i.test(text))result=await runAction('get_whatsapp_link',{},request,env);
   else if(/weather|best time|hidden gems|articles|journal|blog/i.test(text))result=await runAction('search_articles',{query:/weather|best time/i.test(text)?'weather':/hidden gems/i.test(text)?'hidden':''},request,env);
   else {const match=text.match(/\b(one|two|three|four|five|[1-5])[ -]?days?\b/i),days=match?({'one':1,'two':2,'three':3,'four':4,'five':5}[match[1].toLowerCase()]||Number(match[1])):undefined;result=await runAction('search_tours',{query:days?'':/custom|beyond/i.test(text)?'':text.replace(/\b(find|show|tours?|please|me|a|the|treks?|jungle)\b/gi,' ').trim(),...(days?{days}:{})},request,env);}
  }catch(e){result={error:e.name==='ZodError'?'Invalid action arguments. See /agents for schemas.':e.type?'Checkout unavailable. Please contact the team.':e.message};}
  return Message.fromJSON({messageId:crypto.randomUUID(),contextId:message.contextId||crypto.randomUUID(),role:'ROLE_AGENT',parts:[{text:JSON.stringify(result)},{data:result}]});
 }};
 const input=await readAgentBody(request);
 if(['SendStreamingMessage','SubscribeToTask'].includes(input.method))return Response.json({jsonrpc:'2.0',id:input.id??null,error:JsonRpcTransportHandler.mapToJSONRPCError(new UnsupportedOperationError('Streaming is not offered. Use SendMessage.'))});
 const rpc=new JsonRpcTransportHandler(handler);const output=await rpc.handle(input,new ServerCallContext({requestedVersion:'1.0'}));
 return Response.json(output,{headers:{'Cache-Control':'no-store','A2A-Version':'1.0'}});
 }catch{return Response.json({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid request.'}},{status:400});}
}
