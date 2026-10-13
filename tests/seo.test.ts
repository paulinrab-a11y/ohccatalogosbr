import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { catalogSeoContext, productDescription } from '../src/lib/seo.ts';

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

test('catalog canonical keeps only known category and brand, never tracking or free text', () => {
 const seo = (q: string) => catalogSeoContext(new URLSearchParams(q));
 assert.deepEqual(seo(''), { context: '', path: '/catalogo' });
 assert.deepEqual(seo('marca=BMW&utm_source=ig&fbclid=x&q=m3'), { context: 'BMW', path: '/catalogo?marca=BMW' });
 assert.deepEqual(seo('marca=BMW&categoria=Volantes'), { context: 'Volantes · BMW', path: '/catalogo?categoria=Volantes&marca=BMW' });
 assert.deepEqual(seo('categoria=qualquer+texto&marca=Inexistente'), { context: '', path: '/catalogo' });
});

test('product titles say what the product is, once', async () => {
 const { productTitle } = await import('../src/lib/seo.ts');
 const base = { sku: 'X', slug: 'x', brand: 'BMW', image: null, features: [], application: '', compat: null, price: null, notes: null };
 assert.equal(productTitle({ ...base, name: 'BMW M3 - Carbono', category: 'Volantes' }), 'Volante BMW M3 - Carbono | OHC Motors');
 assert.equal(productTitle({ ...base, name: 'Volante Audi R8', category: 'Volantes' }), 'Volante Audi R8 | OHC Motors');
 assert.equal(productTitle({ ...base, name: 'Paddle Shift Audi B9', category: 'Acessórios' }), 'Paddle Shift Audi B9 | OHC Motors');
});

test('page heads written at build escape text, keep scripts safe and can skip the canonical', async () => {
 const { injectHead, renderHead } = await import('../src/lib/seo.ts');
 const head = renderHead({ title: 'A "x" & <b>', description: 'd', path: '/produto/a', schema: { name: '</script><script>' } });
 assert.match(head, /<title>A &quot;x&quot; &amp; &lt;b&gt;<\/title>/);
 assert.match(head, /rel="canonical" href="https:\/\/www\.ohcmotorsbr\.com\.br\/produto\/a"/);
 assert.ok(!head.includes('</script><script>'));
 assert.match(head, /og:image" content="https:\/\/www\.ohcmotorsbr\.com\.br\/og\/ohc-motors\.jpg"/);
 assert.ok(!renderHead({ title: 't', description: 'd', path: '/', canonical: false }).includes('canonical'));
 const html = '<head><meta charset="UTF-8" /><!--seo:start--><title>old</title><!--seo:end--><link rel="icon" /></head>';
 const out = injectHead(html, { title: 'novo', description: 'd', path: '/' });
 assert.ok(out.includes('<title>novo</title>') && !out.includes('old') && out.includes('rel="icon"'));
 assert.throws(() => injectHead('<head></head>', { title: 't', description: 'd', path: '/' }));
});
