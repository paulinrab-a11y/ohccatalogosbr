import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Readable } from 'node:stream';
process.env.SUPABASE_URL='https://backend.example.invalid';
process.env.SUPABASE_PUBLISHABLE_KEY='synthetic-public';
process.env.SUPABASE_ANON_KEY='synthetic-public-jwt';
process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-service';
process.env.OHC_EDGE_TOKEN='synthetic-internal';
process.env.OHC_RATE_LIMIT_SECRET='synthetic-rate-key-for-tests-only-32';
process.env.OHC_PUBLIC_ORIGIN='https://app.example.invalid';
process.env.NODE_ENV='production';
const auth=await import('../server/adminAuth.js');
const data=await import('../server/adminData.js');
const runtime=await import('../server/runtime.js');
const me=(await import('../api/admin/me.js')).default;
const manage=(await import('../api/admin/manage.js')).default;
const action=(await import('../api/admin/action.js')).default;
const login=(await import('../api/admin/session.js')).default;
const sendOtp=(await import('../api/admin/request-access.js')).default;
const logout=(await import('../api/admin/logout.js')).default;
const submit=(await import('../api/requests.js')).default;
const publicCatalog=(await import('../server/publicCatalog.js')).listPublicProducts;
const uid='00000000-0000-4000-8000-000000000001',sid='00000000-0000-4000-8000-000000000002';
const jwt=(exp=Math.floor(Date.now()/1000)+600)=>'synthetic.'+Buffer.from(JSON.stringify({sub:uid,session_id:sid,exp})).toString('base64url')+'.synthetic';
const req=(body={},token='')=>({method:'POST',headers:{host:'app.example.invalid',origin:'https://app.example.invalid','content-type':'application/json',cookie:token?`ohc_admin_access=${token}`:''},body,socket:{remoteAddress:'192.0.2.1'}});
const res=()=>({statusCode:0,headers:{} as Record<string,any>,body:{} as any,setHeader(k:string,v:any){this.headers[k]=v;},end(v:string){this.body=JSON.parse(v||'{}');}});
function network(t:any,options:{role?:string;active?:boolean;limited?:boolean;logoutFailure?:boolean}={}){
 const calls:Array<{url:string;body:any;headers:any}>=[];
 t.mock.method(globalThis,'fetch',async(url:string,init:any={})=>{
  assert.ok(String(url).startsWith('https://backend.example.invalid/'),'no production network');const body=init.body?JSON.parse(init.body):null;calls.push({url,body,headers:init.headers});
  if(url.endsWith('/auth/v1/user'))return Response.json({id:uid,email:'admin@example.invalid',app_metadata:{role:options.role??'ohc_admin'},user_metadata:{role:'ohc_admin'}});
  if(url.endsWith('/ohc_audit_session_active'))return Response.json(options.active!==false);
  if(url.endsWith('/ohc_audit_consume_limit'))return Response.json({allowed:!options.limited,retry_after:60});
  if(url.includes('/auth/v1/verify'))return Response.json({access_token:jwt(),refresh_token:'synthetic-refresh',expires_in:600});
  if(url.includes('/auth/v1/logout'))return Response.json({}, {status:options.logoutFailure?503:200});
  if(url.includes('/ohc_audit_change_admin_role'))return Response.json({ok:true,admin:{id:uid,email:'other@example.invalid',role:'ohc_admin'}});
  if(url.includes('/functions/v1/ohc-compatibility'))return Response.json({protocol:'OHC-SYNTHETIC'}, {status:201});
  return Response.json([]);
 });return calls;
}
test('gateway validates current server session before every administrative action',async(t)=>{
 const calls=network(t,{active:false});
 for(const handler of [manage,action]){const r=res();await handler(req({action:'products_list'},jwt()),r);assert.equal(r.statusCode,401);}
 assert.ok(!calls.some(c=>c.url.includes('catalog_products')));
 const r=res();await me({...req({},jwt()),method:'GET'},r);assert.equal(r.statusCode,401);
});
test('gateway rejects user metadata privilege escalation and expired JWT',async(t)=>{
 network(t,{role:'user'});let r=res();await manage(req({action:'admins_list'},jwt()),r);assert.equal(r.statusCode,401);
 t.mock.restoreAll();network(t);r=res();await manage(req({action:'admins_list'},jwt(1)),r);assert.equal(r.statusCode,401);
});
test('same-origin JSON required including scheme; missing/forged Origin rejected before Auth',async()=>{
 for(const origin of [undefined,'https://evil.example.invalid','http://app.example.invalid','null']){const q=req();q.headers.origin=origin as any;const r=res();await login(q,r);assert.equal(r.statusCode,403);}
 const q=req();q.headers['content-type']='application/json-evil';const r=res();await login(q,r);assert.equal(r.statusCode,415);
});
test('valid OTP establishes Secure HttpOnly SameSite cookies; tokens stay out of JSON',async(t)=>{
 network(t);const r=res();await login(req({email:'admin@example.invalid',token:'123456'}),r);assert.equal(r.statusCode,200);
 for(const c of r.headers['Set-Cookie']){assert.match(c,/; Secure/);assert.match(c,/HttpOnly/);assert.match(c,/SameSite=Lax/);assert.doesNotMatch(c,/Domain=/);}
 assert.ok(!JSON.stringify(r.body).includes('synthetic-refresh'));
});
test('logout revokes server session and clears both cookies; provider failure not reported as success',async(t)=>{
 let calls=network(t);let r=res();await logout(req({},jwt()),r);assert.equal(r.statusCode,200);assert.ok(calls.some(c=>c.url.includes('/logout?scope=local')));assert.ok(r.headers['Set-Cookie'].every((c:string)=>c.includes('Max-Age=0')));
 t.mock.restoreAll();network(t,{logoutFailure:true});r=res();await logout(req({},jwt()),r);assert.equal(r.statusCode,503);assert.ok(r.headers['Set-Cookie'].every((c:string)=>c.includes('Max-Age=0')));
});
test('login limits use HMAC identifiers, 429 and no user-enumerating response',async(t)=>{
 const calls=network(t,{limited:true});const r=res();await sendOtp(req({email:'synthetic@example.invalid'}),r);assert.equal(r.statusCode,429);assert.equal(r.headers['Retry-After'],'60');
 const payload=calls[0].body;assert.match(payload.p_origin,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(payload).includes('synthetic@example.invalid'));assert.ok(!JSON.stringify(payload).includes('192.0.2.1'));assert.equal(calls.length,1);
});
test('public gateway forces submit action and discards private headers',async(t)=>{
 const calls=network(t);const r=res();await submit(req({action:'save_decision_v2',vehicle_brand:'Teste',vehicle_model:'Fictício',vehicle_year:2025,consent_data_images:true,reviewed_by:'attacker'}),r);assert.equal(r.statusCode,201);
 const edge=calls.find(c=>c.url.includes('/functions/'))!;assert.equal(edge.body.action,'submit');assert.equal(edge.body.reviewed_by,undefined);assert.equal(edge.headers['x-ohc-admin-email'],undefined);
});
test('privilege changes use the verified user token, not service identity or client actor',async(t)=>{
 const calls=network(t);const r=res();await manage(req({action:'admin_set_role',email:'other@example.invalid',make_admin:true,actor:uid},jwt()),r);assert.equal(r.statusCode,200);
 const rpc=calls.find(c=>c.url.endsWith('/ohc_audit_change_admin_role'))!;assert.equal(rpc.headers.Authorization,`Bearer ${jwt()}`);assert.deepEqual(Object.keys(rpc.body).sort(),['p_email','p_make_admin']);
});
test('body validation rejects malformed stream, arrays, null, oversized parsed and streamed bytes',async()=>{
 for(const value of ['{','null','[]',{data:'x'.repeat(4*1024*1024)}])await assert.rejects(auth.readBody(req(value as any)));
 const stream=Readable.from(['{broken']);Object.assign(stream,{headers:{}});await assert.rejects(auth.readBody(stream),{status:400});
 const huge=Readable.from([Buffer.alloc(100),Buffer.alloc(100)]);Object.assign(huge,{headers:{}});await assert.rejects(auth.readBody(huge,150),{status:413});
});
test('media blocks executable types, forged WebP, oversized encoded data and traversal before network',async()=>{
 await assert.rejects(data.uploadMediaAdmin({content_type:'image/svg+xml',data:'AAAA'}),{status:400});
 await assert.rejects(data.uploadMediaAdmin({content_type:'image/webp',data:Buffer.from('<script>bad</script>').toString('base64')}),{status:400});
 await assert.rejects(data.uploadMediaAdmin({content_type:'image/webp',data:'A'.repeat(3500001)}),{status:400});
 for(const path of ['admin/../logo.webp','admin/%2e%2e/logo.webp','logo.webp'])await assert.rejects(data.deleteMediaAdmin(path),{status:400});
});
test('media upload stores a real WebP sent as raw base64 or as the panel data URL',async(t)=>{
 const sharp=(await import('sharp')).default;
 const webp=await sharp({create:{width:8,height:8,channels:3,background:'#214FA1'}}).webp().toBuffer();
 const stored:string[]=[];
 t.mock.method(globalThis,'fetch',async(url:string,init:any={})=>{assert.ok(String(url).startsWith('https://backend.example.invalid/storage/v1/object/'));assert.equal(init.method,'POST');stored.push(String(url));return new Response('{}',{status:200,headers:{'content-type':'application/json'}});});
 for(const value of [webp.toString('base64'),`data:image/webp;base64,${webp.toString('base64')}`]){
  const result=await data.uploadMediaAdmin({name:'Foto Teste.webp',content_type:'image/webp',size:webp.length,data:value});
  assert.match(result.path,/^admin\/[0-9a-f-]{36}-foto-teste\.webp$/);
 }
 assert.equal(stored.length,2);
 await assert.rejects(data.uploadMediaAdmin({content_type:'image/webp',data:`data:image/svg+xml;base64,${webp.toString('base64')}`}),{status:400});
});
test('public catalog projects allowed fields and never exposes private price or admin metadata',async(t)=>{
 t.mock.method(globalThis,'fetch',async(url:string,init:any)=>{assert.ok(url.startsWith('https://backend.example.invalid'));assert.ok(!init.headers.Authorization);return Response.json([{sku:'TEST',ativo:true,responsavel:'private-person',price:999,service_role:'private-token'},{sku:'HIDDEN',ativo:false}]);});
 const result=await publicCatalog();assert.equal(result.length,1);assert.equal(result[0].price,null);assert.ok(!JSON.stringify(result).includes('private-'));
});
test('customer token and forged metadata are rejected by every protected admin gateway',async(t)=>{
 network(t,{role:'authenticated'});
 for(const handler of [manage,action,me,login]){
  const q=req(handler===login?{access_token:jwt(),refresh_token:'synthetic-refresh'}:{action:'admins_list'},jwt());
  if(handler===me)q.method='GET';
  const r=res();await handler(q,r);assert.equal(r.statusCode,401);
 }
 // A customer SDK session never sets administrative cookies.
 const r=res();await me({...req(),method:'GET',headers:{...req().headers,authorization:`Bearer ${jwt()}`}},r);assert.equal(r.statusCode,401);
});
