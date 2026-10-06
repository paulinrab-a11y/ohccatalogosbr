import assert from 'node:assert/strict';
import { test } from 'node:test';

test('sitemap lists only products the site can open (with SKU) and escapes URLs', async () => {
 process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_synthetic';
 const rows = [
  { sku: '1.02.X.1', slug: 'produto-a', ativo: true, imagem_principal: 'https://cdn.invalid/a.webp?x=1&y=2' },
  { sku: null, slug: 'produto-sem-sku', ativo: true },
  { sku: '1.02.X.2', slug: 'produto-inativo', ativo: false },
 ];
 const original = globalThis.fetch;
 globalThis.fetch = (async () => new Response(JSON.stringify(rows), { status: 200 })) as typeof fetch;
 try {
  const { default: handler } = await import('../api/sitemap.js');
  let body = '';
  const headers: Record<string, string> = {};
  const res = { statusCode: 0, setHeader: (k: string, v: string) => { headers[k] = v; }, end: (b: string) => { body = b; } };
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 200);
  assert.match(body, /\/produto\/produto-a</);
  assert.doesNotMatch(body, /produto-sem-sku|produto-inativo/);
  assert.match(body, /a\.webp\?x=1&amp;y=2/);
 } finally {
  globalThis.fetch = original;
 }
});
