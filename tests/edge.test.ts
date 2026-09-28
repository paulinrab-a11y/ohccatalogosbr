import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=readFileSync('supabase/functions/ohc-compatibility/index.ts','utf8').replace(/^import .*edge-runtime.d.ts.*;\n/,'');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const sid='00000000-0000-4000-8000-000000000001',uid='00000000-0000-4000-8000-000000000002';
function harness(options:{admin?:boolean;active?:boolean;authStatus?:number;failure?:boolean;cleanupFailure?:boolean;rate?:boolean}={}){
 const calls:Array<{url:string;body:any}>=[],logs:string[]=[];
 let handler!:(r:Request)=>Promise<Response>;
 const env:Record<string,string>={SUPABASE_URL:'https://backend.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-service-only',SUPABASE_ANON_KEY:'test-public',OHC_EDGE_TOKEN:'test-internal-only'};
 vm.runInNewContext(js,{Deno:{env:{get:(k:string)=>env[k]},serve:(h:typeof handler)=>{handler=h;}},Request,Response,Headers,URL,TextEncoder,TextDecoder,Uint8Array,AbortSignal,crypto,atob,console:{error:(v:string)=>logs.push(v)},fetch:async(url:string,init:any={})=>{
  assert.ok(url.startsWith('https://backend.invalid/'),'test must never contact production');
  const body=init.body?JSON.parse(init.body):null;calls.push({url,body});
  if(url.includes('/auth/v1/user'))return Response.json({id:uid,email:'admin@example.invalid',app_metadata:{role:options.admin===false?'user':'ohc_admin'},user_metadata:{role:'ohc_admin'}},{status:options.authStatus??200});
  if(url.endsWith('/ohc_audit_session_active'))return Response.json(options.active!==false);
  if(options.failure)return new Response('private token database detail',{status:500});
  if(url.includes('/ohc_consume_public_rate_limit'))return Response.json({allowed:options.rate!==false,retry_after:60});
  if(url.includes('/ohc_record_public_compatibility_query'))return Response.json({ok:true,request_id:sid,protocol:'SYNTHETIC-1',status:'analise_necessaria'});
  if(url.includes('/ohc_save_compatibility_decision_v2'))return Response.json({ok:true});
  if(options.cleanupFailure && url.includes('delete_after='))return new Response('private cleanup detail',{status:500});
  return Response.json([]);
 }});
 const token='test.'+Buffer.from(JSON.stringify({sub:uid,session_id:sid})).toString('base64url')+'.test';
 const request=(body:unknown,auth:'internal'|'bearer'|'none'='internal',headers:Record<string,string>={})=>handler(new Request('https://edge.invalid',{method:'POST',headers:{'content-type':'application/json',...(auth==='internal'?{'x-ohc-internal-token':env.OHC_EDGE_TOKEN}:auth==='bearer'?{authorization:'Bearer '+token}:{}),...headers},body:typeof body==='string'?body:JSON.stringify(body)}));
 return {request,calls,logs,handler};
}
const valid={action:'submit',vehicle_brand:'Fictícia',vehicle_model:'Teste',vehicle_year:2025,consent_data_images:true};
test('edge rejects anonymous direct admin calls and methods before any database operation',async()=>{
 const h=harness();assert.equal((await h.request({action:'products'},'none')).status,401);assert.equal((await h.handler(new Request('https://edge.invalid'))).status,405);assert.equal(h.calls.length,0);
});
test('edge checks provider identity and current session, rejects forged metadata, invalid/expired/revoked tokens',async()=>{
 for(const opts of [{admin:false},{active:false},{authStatus:401}]){const h=harness(opts);assert.equal((await h.request({action:'products'},'bearer')).status,401);assert.ok(!h.calls.some(c=>c.url.includes('catalog_products')));}
 const h=harness();assert.equal((await h.request({action:'products'},'bearer')).status,200);assert.ok(h.calls.some(c=>c.url.endsWith('ohc_audit_session_active')));
});
test('edge bounds JSON bodies and rejects malformed JSON, arrays, wrong MIME',async()=>{
 const h=harness();for(const v of ['{','null','[]'])assert.equal((await h.request(v)).status,400);
 assert.equal((await h.request(valid,'internal',{'content-type':'text/plain'})).status,415);
 assert.equal((await h.request(valid,'internal',{'content-length':'999999999'})).status,413);
 const big=JSON.stringify({...valid,padding:'x'.repeat(22*1024*1024)});assert.equal((await h.request(big)).status,413);assert.equal(h.calls.length,0);
});
test('edge rejects spoofed uploads, bad size, too many files and oversized base64 before DB',async()=>{
 const bad=[null,{size:8,content_type:'image/png',data:btoa('notimage')},{size:NaN,content_type:'image/png',data:''},{size:1,content_type:'image/svg+xml',data:'eA=='},{size:1,content_type:'image/png',data:'A'.repeat(7000000)}];
 for(const file of bad){const h=harness();assert.equal((await h.request({...valid,files:[file]})).status,400);assert.equal(h.calls.length,0);}
 const h=harness();assert.equal((await h.request({...valid,files:[{}, {}, {}, {}]})).status,400);assert.equal((await h.request({...valid,files:'bad'})).status,400);
});
test('edge returns shared limiter 429 and Retry-After without writing a request',async()=>{
 const h=harness({rate:false});const r=await h.request(valid);assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'60');assert.equal(h.calls.length,1);
});
test('edge ignores mass assignment and derives actor from validated backend identity',async()=>{
 const h=harness();assert.equal((await h.request({action:'save_decision_v2',id:sid,status:'compativel',reviewed_by:'attacker',role:'admin',owner_id:'attacker'},'bearer')).status,200);
 const payload=h.calls.find(c=>c.url.endsWith('ohc_save_compatibility_decision_v2'))!.body;assert.equal(payload.p_reviewed_by,'admin@example.invalid');assert.ok(!('role' in payload));assert.ok(!('owner_id' in payload));
 assert.equal((await h.request({action:'admin_detail',id:'x&select=*'},'bearer')).status,400);
});

test('admin dashboard is read-only; photo cleanup only runs through explicit cleanup action',async()=>{
 const h=harness();
 const dashboard=await h.request({action:'admin_dashboard'},'bearer');
 assert.equal(dashboard.status,200);
 assert.ok(!h.calls.some(c=>c.url.includes('delete_after=')));
 const cleanup=await h.request({action:'cleanup'},'bearer');
 assert.equal(cleanup.status,200);
 assert.ok(h.calls.some(c=>c.url.includes('delete_after=')));
});
test('edge errors are redacted, private responses no-store; cleanup failure cannot duplicate accepted request',async()=>{
 const h=harness({failure:true});const r=await h.request({action:'products'},'bearer');assert.equal(r.status,500);assert.match(r.headers.get('cache-control')??'',/no-store/);assert.ok(!(await r.text()).includes('private'));assert.ok(!JSON.stringify(h.logs).includes('private'));assert.ok(h.logs.length>0);
 const h2=harness({cleanupFailure:true});assert.equal((await h2.request(valid)).status,201);assert.ok(h2.logs.some(l=>l.includes('photo_cleanup_failed')));
});
