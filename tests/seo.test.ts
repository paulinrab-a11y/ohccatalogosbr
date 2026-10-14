import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { catalogSeoContext, productDescription, productHead, productMetaDescription } from '../src/lib/seo.ts';

const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));

test('product description never promises compatibility, manufacturing or sport styling', () => {
 for (const p of products) {
  const product = { ...p, features: p.features || [] };
  for (const text of [productDescription(product), productMetaDescription(product)]) {
   assert.ok(text.includes('Confirme a compatibilidade com o seu carro antes da compra.'), p.sku);
   assert.doesNotMatch(text, /fabricad|volante esportivo/i, p.sku);
   for (const vehicle of p.compat || []) assert.ok(!text.includes(`Compatível com ${vehicle}`), p.sku);
  }
  // What Google shows in results; longer text is cut mid-sentence.
  assert.ok(productMetaDescription(product).length <= 160, p.sku);
  // Notes have their own box on the page; the description must not repeat them.
  if (p.notes) assert.ok(!productDescription(product).includes(p.notes), p.sku);
 }
});

test('product JSON-LD: maker as brand, breadcrumb beside the product, new item with 7-day returns', () => {
 const wheel = products.find((p: any) => p.category === 'Volantes');
 const grille = products.find((p: any) => p.category === 'Grades');
 const graph = (p: any, price?: number) => (productHead({ ...p, features: p.features || [], price: price ?? null }).schema as any)['@graph'];
 const [item, crumbs] = graph(wheel, 2000);
 assert.equal(item['@type'], 'Product');
 assert.deepEqual(item.brand, { '@type': 'Brand', name: 'OHC Motors' });
 assert.equal(item.breadcrumb, undefined);
 assert.equal(crumbs['@type'], 'BreadcrumbList');
 assert.equal(crumbs.itemListElement.length, 3);
 assert.equal(item.offers.price, 2000);
 assert.equal(item.offers.itemCondition, 'https://schema.org/NewCondition');
 assert.equal(item.offers.hasMerchantReturnPolicy.merchantReturnDays, 7);
 // Not a car maker as brand, and no invented maker for other parts.
 assert.equal(graph(grille)[0].brand, undefined);
 assert.equal(graph(wheel)[0].offers, undefined);
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
