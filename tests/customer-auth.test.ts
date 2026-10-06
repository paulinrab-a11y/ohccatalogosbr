import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emailValue, passwordError, authError, verificationCode } from '../src/lib/customerValidation';
import { internalDestination } from '../src/lib/navigation';
import config from '../api/customer-config.js';
const response=()=>({statusCode:0,body:{} as Record<string,unknown>,headers:{} as Record<string,unknown>,setHeader(k:string,v:unknown){this.headers[k]=v},end(v:string){this.body=JSON.parse(v)}});
test('customer normalization and password policy preserve passwords without silent trimming',()=>{
 assert.equal(emailValue(' Cliente@Example.com '),'cliente@example.com');
 for(const email of ['x','a b@example.com','a@b','a'.repeat(250)+'@b.com'])assert.throws(()=>emailValue(email));
 assert.equal(passwordError('Uma frase longa 123!','Uma frase longa 123!'),'');
 for(const [a,b]of [['curta','curta'],[' Uma frase longa',' Uma frase longa'],['Uma frase longa','Outra frase longa'],['x'.repeat(129),'x'.repeat(129)]])assert.ok(passwordError(a,b));
});
test('provider errors cannot leak raw details or identify registered accounts',()=>{
 assert.equal(authError({message:'secret token and internal database error'}),'Não foi possível concluir. Tente novamente em alguns instantes.');
 assert.match(authError({code:'invalid_credentials'}),/inválidos/);
 assert.match(authError({status:429}),/Muitas tentativas/);
 assert.equal(authError({code:'user_already_exists'}),authError({code:'user_not_found'}));
});
test('customer routes use existing router without expanding open redirects',()=>{
 for(const path of ['/conta','/conta/criar','/conta/recuperar','/conta/redefinir','/conta/confirmar','/minha-conta']) assert.equal(internalDestination(path,'https://ohc.invalid'),path);
 for(const path of ['//evil.invalid/conta','https://evil.invalid/conta','/conta/../../admin','/conta/%2e%2e/admin'])assert.equal(internalDestination(path,'https://ohc.invalid'),null);
});
test('public configuration whitelists values, rejects secrets and blocks production fallback in preview',async(t)=>{
 t.mock.method(console,'error',()=>{});
 process.env.SUPABASE_URL='https://production.supabase.co';
 process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_public';
 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-service';
 delete process.env.OHC_CUSTOMER_SUPABASE_URL; delete process.env.OHC_CUSTOMER_PUBLISHABLE_KEY;
 process.env.VERCEL_ENV='production';
 let r=response();await config({method:'GET'},r);assert.equal(r.statusCode,200);assert.deepEqual(Object.keys(r.body).sort(),['publishableKey','url']);assert.match(String(r.headers['Cache-Control']),/no-store/);
 process.env.VERCEL_ENV='preview';r=response();await config({method:'GET'},r);assert.equal(r.statusCode,503);
 process.env.OHC_CUSTOMER_SUPABASE_URL='https://development.supabase.co';
 process.env.OHC_CUSTOMER_PUBLISHABLE_KEY='sb_publishable_development';
 r=response();await config({method:'GET'},r);assert.equal(r.statusCode,200);assert.equal(r.body.url,'https://development.supabase.co');
 for(const key of ['sb_secret_private','synthetic.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.synthetic']){
 process.env.OHC_CUSTOMER_PUBLISHABLE_KEY=key;r=response();await config({method:'GET'},r);assert.equal(r.statusCode,503);assert.ok(!JSON.stringify(r.body).includes(key));}
 process.env.OHC_CUSTOMER_PUBLISHABLE_KEY='sb_publishable_development';
 for(const url of ['https://evil.invalid','https://development.supabase.co@evil.invalid','https://development.supabase.co/path','http://development.supabase.co']){process.env.OHC_CUSTOMER_SUPABASE_URL=url;r=response();await config({method:'GET'},r);assert.equal(r.statusCode,503);}
 r=response();await config({method:'DELETE'},r);assert.equal(r.statusCode,405);
});

test('email confirmation codes accept six to eight numeric digits',()=>{
 assert.equal(verificationCode(' 123456 '),'123456');
 assert.equal(verificationCode('12345678'),'12345678');
 assert.equal(verificationCode('123 456'),'123456');
 assert.equal(verificationCode('1234 5678'),'12345678');
 assert.throws(()=>verificationCode('12-34-56'));
 assert.throws(()=>verificationCode('123456789'));
 assert.throws(()=>verificationCode('abc123456'));
 assert.throws(()=>verificationCode('12345'));
 assert.throws(()=>verificationCode('abcdef'));
});
