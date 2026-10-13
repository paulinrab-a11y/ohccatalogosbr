import assert from 'node:assert/strict';
import { test } from 'node:test';

test('promotion dates are whole São Paulo days', async () => {
 const { promoBoundary } = await import('../server/adminData.js');
 assert.equal(promoBoundary('2026-10-31', 'start'), '2026-10-31T03:00:00.000Z');
 assert.equal(promoBoundary('2026-10-31', 'end'), '2026-11-01T02:59:59.000Z');
 for (const bad of ['', null, '31/10/2026', '2026-13-40', 'x']) assert.equal(promoBoundary(bad, 'start'), null, String(bad));
});

test('published prices are attached by SKU and never invented', async () => {
 const { withPrices } = await import('../server/publicCatalog.js');
 const rows = [{ sku: 'A', categoria: 'Volantes' }, { sku: 'B', categoria: 'Grades' }];
 const out = withPrices(rows, [{ sku: 'A', price: '3290.00', card_price: null, promotional_price: '0', promotional_price_ends_at: '2026-10-31T23:59:59-03:00' }]);
 assert.equal(out[0].price, 3290);
 assert.equal(out[0].card_price, null);
 assert.equal(out[0].promotional_price, null);
 assert.equal(out[1].price, null);
 assert.ok(!('price_demo' in out[0]));
});

test('demonstration prices are flagged and never served in production', async () => {
 const original = globalThis.fetch;
 const env = { ...process.env };
 process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_synthetic';
 globalThis.fetch = (async (url: string) => new Response(JSON.stringify(String(url).includes('product_prices') ? [] : [{ sku: 'A', categoria: 'Volantes', ativo: true }]), { status: 200 })) as typeof fetch;
 try {
  const mod = await import('../server/publicCatalog.js?demo=' + Date.now());
  process.env.VERCEL_ENV = 'preview';
  const preview = await mod.listPublicProducts();
  assert.equal(preview[0].price_demo, true);
  assert.ok(preview[0].price > 0);
  process.env.VERCEL_ENV = 'production';
  const prod = await mod.listPublicProducts();
  assert.equal(prod[0].price, null);
  assert.ok(!prod[0].price_demo);
 } finally {
  globalThis.fetch = original;
  process.env = env;
 }
});
