// Development only. Run from the OHC folder; never deploy this file.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import { randomBytes } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';

export function localConfig(text) {
 const env=parseEnv(text.replace(/^\uFEFF/,''));
 const url=new URL(env.API_URL || 'http://invalid.invalid');
 if(url.protocol!=='http:' || !['127.0.0.1','localhost'].includes(url.hostname) || url.port!=='54321' || url.username || url.password || url.pathname!=='/' || url.search || url.hash) throw Error('A configuração deve apontar somente para o Supabase local na porta 54321.');
 if(!env.ANON_KEY?.startsWith('eyJ') || !env.SERVICE_ROLE_KEY?.startsWith('eyJ')) throw Error('Não encontrei ANON_KEY e SERVICE_ROLE_KEY locais. Exporte novamente supabase status -o env.');
 return {SUPABASE_URL:url.origin,SUPABASE_ANON_KEY:env.ANON_KEY,SUPABASE_PUBLISHABLE_KEY:env.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:env.SERVICE_ROLE_KEY};
}

async function main() {
 const root=process.cwd();
 if(!existsSync(resolve(root,'api/catalog.js')) || !existsSync(resolve(root,'package.json'))) throw Error('Execute na pasta ohc que contém package.json e api.');
 const config=localConfig(readFileSync(resolve(root,'.env.supabase-local'),'utf8'));
 const secretPath=resolve(root,'.env.ohc-local-secrets');
 if(!existsSync(secretPath)) writeFileSync(secretPath,`OHC_EDGE_TOKEN=${randomBytes(32).toString('hex')}\nOHC_RATE_LIMIT_SECRET=${randomBytes(32).toString('hex')}\n`,{flag:'wx',mode:0o600});
 const secrets=parseEnv(readFileSync(secretPath,'utf8'));
 if(!/^[a-f0-9]{64}$/.test(secrets.OHC_EDGE_TOKEN||'') || !/^[a-f0-9]{64}$/.test(secrets.OHC_RATE_LIMIT_SECRET||'')) throw Error('Arquivo de segredos locais inválido.');
 Object.assign(process.env,config,{OHC_EDGE_TOKEN:secrets.OHC_EDGE_TOKEN,OHC_RATE_LIMIT_SECRET:secrets.OHC_RATE_LIMIT_SECRET,NODE_ENV:'development',OHC_PUBLIC_ORIGIN:'http://127.0.0.1:3000',OHC_ALLOWED_ORIGINS:'http://localhost:3000',OHC_ADMIN_EMAILS:''});
 delete process.env.VERCEL; delete process.env.VERCEL_URL;
 delete process.env.VITE_SENTRY_DSN;
 const load=path=>import(pathToFileURL(resolve(root,path)).href);
 const {listPublicProducts}=await load('server/publicCatalog.js');
 const products=await listPublicProducts();
 if(!products.some(p=>p.sku==='TESTE-OHC-001')) throw Error('O banco local não retornou o produto fictício. Confira a importação SQL.');
 const routes=new Map();
 for(const path of ['catalog','requests','admin/me','admin/session','admin/request-access','admin/logout','admin/action','admin/manage']) routes.set('/api/'+path,(await load('api/'+path+'.js')).default);
 let vite;
 const server=createHttpServer(async(req,res)=>{
  const fail=(status,message)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:message}));};
  if(!['127.0.0.1:3000','localhost:3000'].includes(req.headers.host))return fail(403,'Host local inválido.');
  if(req.method==='POST' && !['http://127.0.0.1:3000','http://localhost:3000'].includes(req.headers.origin))return fail(403,'Origem local inválida.');
  const path=new URL(req.url,'http://127.0.0.1:3000').pathname;
  if(path.startsWith('/api/')){
   const handler=routes.get(path);if(!handler)return fail(404,'API não encontrada.');
   try{await handler(req,res);}catch{if(!res.headersSent)fail(500,'Falha local da API.');else res.end();}
   return;
  }
  vite.middlewares(req,res);
 });
 const {createServer}=await import('vite');
 const react=(await import('@vitejs/plugin-react')).default;
 vite=await createServer({root,configFile:false,envDir:false,plugins:[react()],server:{middlewareMode:true,hmr:{server}},appType:'spa'});
 server.requestTimeout=30000;
 server.on('error',()=>{console.error('Não foi possível abrir a porta 3000. Feche outro servidor local nessa porta.');process.exitCode=1;vite.close();});
 server.listen(3000,'127.0.0.1',()=>console.log('OHC LOCAL: http://127.0.0.1:3000/catalogo\nBanco local conectado. Nenhuma chave foi exibida.\nLogin e fotos exigem a próxima etapa de configuração local.'));
 const stop=()=>{server.close();vite.close().then(()=>process.exit(0));};
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) main().catch(()=>{console.error('Não foi possível iniciar. Confira: pasta ohc, Docker ativo, .env.supabase-local exportado e SQL importado. Nenhuma chave foi exibida.');process.exitCode=1;});
