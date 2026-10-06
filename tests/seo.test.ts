import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { productDescription } from '../src/lib/seo.ts';

const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));

test('product description never promises compatibility, manufacturing or sport styling', () => {
 for (const p of products) {
  const text = productDescription({ ...p, features: p.features || [] });
  assert.ok(text.includes('Confirme a compatibilidade com o seu carro antes da compra.'), p.sku);
  assert.doesNotMatch(text, /fabricad|volante esportivo/i, p.sku);
  for (const vehicle of p.compat || []) assert.ok(!text.includes(`Compatível com ${vehicle}`), p.sku);
  assert.ok(text.length <= 300, p.sku);
 }
});
