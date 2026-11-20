import test from 'node:test';import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {handleMcp} from './mcp-server.js';import {handleA2a} from './a2a-server.js';import {runAction} from './agent-actions.js';
test('MCP official client negotiates and searches/quotes the actual offered tours',async()=>{
 const client=new Client({name:'QA',version:'1.0.0'});const transport=new StreamableHTTPClientTransport(new URL('https://www.exploresumatraescape.com/mcp'),{fetch:(url,options)=>handleMcp(new Request(url,options),{})});
 await client.connect(transport);const tools=await client.listTools();assert.equal(tools.tools.length,6);
 const result=await client.callTool({name:'quote_tour',arguments:{tour:'BL-02D',travellers:3}});assert.equal(result.structuredContent.total_eur,360);
 const bad=await client.callTool({name:'create_checkout_link',arguments:{customer_consent:false}});assert.equal(bad.isError,true);
 const tours=await client.callTool({name:'search_tours',arguments:{days:2}});assert.equal(tours.structuredContent.tours.length,1);assert.equal(tours.structuredContent.custom.price,null);
 const links=await client.callTool({name:'get_whatsapp_link',arguments:{message:'Hello & help?'}});assert.match(links.structuredContent.url,/Hello%20%26%20help%3F/);assert.equal(links.structuredContent.message_sent,false);await client.close();
});
test('agent actions reject arbitrary prices, unsupported tours, missing consent and foreign browser origins',async()=>{
 await assert.rejects(()=>runAction('quote_tour',{tour:'BL-02D',travellers:3,amount:1}),/Unrecognized key/);
 await assert.rejects(()=>runAction('create_checkout_link',{request_id:crypto.randomUUID(),tour:'BL-02D',departure:'2099-01-01',travellers:1,name:'Test',email:'test@example.com',customer_consent:false}));
 const r=await handleMcp(new Request('https://www.exploresumatraescape.com/mcp',{method:'POST',headers:{origin:'https://evil.example'},body:'{}'}),{});assert.equal(r.status,403);
});
test('A2A 1.0 JSON-RPC returns a valid immediate agent message and rejects old versions',async()=>{
 const payload={jsonrpc:'2.0',id:1,method:'SendMessage',params:{message:{messageId:crypto.randomUUID(),role:'ROLE_USER',parts:[{data:{action:'quote_tour',arguments:{tour:'BL-02D',travellers:2}}}]}}};
 const r=await handleA2a(new Request('https://www.exploresumatraescape.com/a2a',{method:'POST',headers:{'A2A-Version':'1.0','Content-Type':'application/json'},body:JSON.stringify(payload)}),{});assert.equal(r.status,200);const value=await r.json();assert.ok(!value.error,JSON.stringify(value));assert.equal(value.result.message.role,'ROLE_AGENT');assert.equal(value.result.message.parts.find(p=>p.data).data.total_eur,240);
 const old=await handleA2a(new Request('https://www.exploresumatraescape.com/a2a',{method:'POST',body:'{}'}),{});assert.equal(old.status,400);
});
