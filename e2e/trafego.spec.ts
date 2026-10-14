import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
const day = 86400000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();
const [A, B, C] = products.filter((p: any) => p.category === 'Volantes');

// Synthetic catalog: A has a running promotion, B a regular price, C no price.
function catalog(promo: { start?: string | null; end?: string | null; price?: number } | null) {
 return products.map((p: any) => ({
  sku: p.sku, slug: p.slug, nome_produto: p.name, marca: p.brand, categoria: p.category, ativo: true, imagem_principal: p.image,
  price: p.sku === C.sku ? null : 3000,
  card_price: p.sku === A.sku ? 3360 : null,
  promotional_price: p.sku === A.sku && promo ? (promo.price ?? 2700) : null,
  promotional_price_starts_at: p.sku === A.sku && promo ? promo.start ?? null : null,
  promotional_price_ends_at: p.sku === A.sku && promo ? promo.end ?? null : null,
 }));
}
async function serve(page: Page, promo: Parameters<typeof catalog>[0]) {
 await page.route('**/api/catalog', (route) => route.fulfill({ json: { products: catalog(promo) } }));
}

test('a running promotion shows in the menu, on /promocoes and on the cards', async ({ page }) => {
 await serve(page, { start: iso(-day), end: iso(5 * day) });
 await page.goto('/promocoes');
 await expect(page).toHaveURL(/\/promocoes$/);
 const card = page.locator('article', { hasText: A.name }).first();
 await expect(card.getByText('-10%')).toBeVisible();
 await expect(card.getByText(/R\$\s3\.000,00/)).toBeVisible();
 await expect(card.getByText(/R\$\s2\.700,00/)).toBeVisible();
 await expect(card.getByText(/3x de R\$\s1\.120,00 sem juros/)).toBeVisible();
 // Phones reach the menu through the hamburger; wide screens see the bar.
 const open = page.getByRole('button', { name: 'Abrir menu' });
 if (await open.isVisible()) await open.click();
 await expect(page.getByRole('link', { name: /Promoções/ }).first()).toBeVisible();
});

test('without a running promotion there is no menu item and /promocoes goes to the catalog', async ({ page }) => {
 for (const promo of [null, { end: iso(-day) }, { start: iso(day) }, { price: 3500 }]) {
  await serve(page, promo);
  await page.goto('/promocoes');
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole('link', { name: /Promoções/ })).toHaveCount(0);
  await expect(page.getByText('-10%')).toHaveCount(0);
  await page.unrouteAll();
 }
});

test('product page: price above the fold, regular price without promo, "Consulte" without price', async ({ page }) => {
 await serve(page, null);
 await page.goto(`/produto/${B.slug}`);
 const price = page.getByText(/R\$\s3\.000,00/).first();
 await expect(price).toBeVisible();
 await expect(page.getByText('ou 3x sem juros no cartão (até 12x com juros)')).toBeVisible();
 expect((await price.boundingBox())!.y).toBeLessThan(page.viewportSize()!.height);
 await page.goto(`/produto/${C.slug}`);
 await expect(page.getByText('Consulte no WhatsApp')).toBeVisible();
 await expect(page.getByRole('link', { name: 'Comprar pelo WhatsApp' }).first()).toBeVisible();
});

test('the WhatsApp message carries product, code, current price and the ad reference', async ({ page }) => {
 await serve(page, { end: iso(3 * day) });
 await page.goto(`/produto/${A.slug}?utm_source=meta&utm_campaign=Volantes%20BMW&fbclid=synthetic`);
 await expect(page.getByText(/R\$\s2\.700,00/).first()).toBeVisible();
 const href = await page.getByRole('link', { name: 'Comprar pelo WhatsApp' }).first().getAttribute('href');
 const text = decodeURIComponent(href!.split('text=')[1]);
 expect(text).toContain(`${A.name} (código ${A.sku})`);
 expect(text).toMatch(/por R\$\s2\.700,00 no PIX/);
 expect(text).toContain('(ref: meta-volantes-bmw)');
 // The reference survives navigation inside the visit.
 await page.goto(`/produto/${B.slug}`);
 await expect(page.getByText(/R\$\s3\.000,00/).first()).toBeVisible();
 const next = await page.getByRole('link', { name: 'Comprar pelo WhatsApp' }).first().getAttribute('href');
 expect(decodeURIComponent(next!)).toContain('(ref: meta-volantes-bmw)');
});

test('ad links may filter the catalog in short form and sort by price', async ({ page }) => {
 await serve(page, null);
 await page.goto('/catalogo?marca=bmw&categoria=volantes&ordem=preco-desc');
 await expect(page.getByRole('button', { name: /^BMW/ })).toHaveAttribute('aria-pressed', 'true');
 await expect(page.getByRole('button', { name: /^Volantes/ })).toHaveAttribute('aria-pressed', 'true');
 await expect(page.getByLabel('Ordenar')).toHaveValue('preco-desc');
 await expect(page).toHaveURL(/categoria=Volantes&marca=BMW&ordem=preco-desc/);
});

test('home featured grid fills whole rows, curated picks first', async ({ page, isMobile }) => {
 test.skip(isMobile, 'phones show the featured cards as a swipeable row');
 await serve(page, null);
 await page.goto('/');
 const section = page.locator('section', { has: page.getByRole('heading', { name: 'Em destaque' }) });
 await expect(section.locator('article').first()).toBeVisible();
 await expect(section.locator('article')).toHaveCount(8);
});

test('catalog cards stay lean: no fitment plate, aligned rows, wheels before accessories in each brand', async ({ page }) => {
 await serve(page, null);
 await page.goto('/catalogo');
 const sections = page.locator('main section');
 await expect(sections.first().locator('article').first()).toBeVisible();
 await expect(page.locator('main article dl')).toHaveCount(0);
 // Cards sharing a row share their top and their height.
 const boxes = await sections.first().locator('article').evaluateAll((els) => els.slice(0, 2).map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)]; }));
 expect(boxes[0]).toEqual(boxes[1]);
 const category = new Map(products.map((p: any) => [p.name, p.category]));
 for (const section of await sections.all()) {
  const names = await section.locator('article h3').allTextContents();
  const cats = names.map((n) => category.get(n.trim()));
  const firstOther = cats.findIndex((c) => c !== 'Volantes');
  if (firstOther >= 0) expect(cats.slice(firstOther)).not.toContain('Volantes');
 }
});

test('a slow catalog shows card placeholders and the page does not jump when it arrives', async ({ page }) => {
 await page.route('**/api/catalog', async (route) => { await new Promise((r) => setTimeout(r, 1200)); await route.fulfill({ json: { products: catalog(null) } }); });
 await page.addInitScript(() => { (window as any).__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) (window as any).__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
 await page.goto('/catalogo');
 await expect(page.getByTestId('catalog-skeleton')).toBeVisible();
 await expect(page.locator('main article').first()).toBeVisible();
 await expect(page.getByTestId('catalog-skeleton')).toHaveCount(0);
 expect(await page.evaluate(() => (window as any).__cls)).toBeLessThan(0.1);
});
