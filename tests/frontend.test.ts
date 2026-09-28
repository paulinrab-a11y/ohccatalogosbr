import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { compatibilityMessage } from '../src/lib/compatibility';
import { internalDestination } from '../src/lib/navigation';
import { safeEvent } from '../src/lib/telemetry';
import { PRODUCTS } from '../src/lib/products';
test('navigation rejects external, protocol-relative, control and unregistered destinations', () => {
  for (const path of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/admin/inexistente', '/api/admin', '/%2e%2e/admin', '/catalogo\n']) assert.equal(internalDestination(path, 'https://ohc.invalid'), null);
  assert.equal(internalDestination('/produto?sku=test#foto', 'https://ohc.invalid'), '/produto?sku=test#foto');
});
test('compatibility keeps the actual catalog SKU and business message', () => {
  const text = compatibilityMessage({marca:'Marca fictícia',modelo:'Teste',ano:'2025',acc:'Não',sku:PRODUCTS[0].sku},2026);
  assert.match(text, /confirmar a compatibilidade/); assert.ok(text.includes(PRODUCTS[0].sku)); assert.match(text,/3 fotos/);
});
test('compatibility rejects invalid types, years, unexpected privileges and oversized text', () => {
  const base={marca:'Teste',modelo:'Fictício',ano:'2025'};
  for(const extra of [{ano:'2028'},{ano:'1949'},{ano:'NaN'},{marca:42},{modelo:''},{obs:'a'.repeat(1001)},{role:'admin'},{sku:'not-a-real-sku'},{acc:'root'}]) assert.throws(()=>compatibilityMessage({...base,...extra},2026));
});
test('telemetry drops PII, tokens, queries, request bodies and original messages', () => {
  const event = {event_id:'synthetic-event',timestamp:1,user:{email:'ficticio@example.invalid'},request:{data:'private'},breadcrumbs:[{message:'private'}],tags:{component:'app',secret:'private'},exception:{values:[{value:'private',stacktrace:{frames:[{filename:'https://ohc.invalid/assets/app-123.js?token=private',lineno:3},{filename:'https://external.invalid/path/private'}]}}]}};
  const clean=safeEvent(event); const json=JSON.stringify(clean);
  assert.ok(!json.includes('private')); assert.ok(!json.includes('example.invalid')); assert.equal(clean.exception.values[0].stacktrace.frames.length,1); assert.equal(clean.tags.component,'app');
});
test('65 original products retain resolvable local original images', () => {
  assert.equal(PRODUCTS.length,65);
  const raw=readFileSync('src/data/products.json','utf8');
  for(const path of raw.match(/\/(?:img|imagens)\/[^"\s]+/g) ?? []) assert.ok(existsSync('public'+path),path);
  const glb=readFileSync('public/models/steering-wheel-original.glb'); assert.equal(glb.toString('ascii',0,4),'glTF');
});
test('deployment headers protect content without swallowing backend or model paths', () => {
  const c=JSON.parse(readFileSync('vercel.json','utf8'));
  const headers=Object.fromEntries(c.headers[0].headers.map((h:{key:string;value:string})=>[h.key,h.value]));
  assert.match(headers['Content-Security-Policy'],/frame-ancestors 'none'/);assert.match(headers['Content-Security-Policy'],/script-src 'self';/);assert.equal(headers['X-Content-Type-Options'],'nosniff');
  assert.ok(!c.rewrites.some((r:{source:string})=>r.source==='/(.*)' || r.source==='/:path*'));
});
