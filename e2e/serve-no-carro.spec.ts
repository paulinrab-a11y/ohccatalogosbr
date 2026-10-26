import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
const bmw = products.filter((p: any) => p.brand === 'BMW' && p.category === 'Volantes');
const [FITS, COND] = bmw;

async function serve(page: Page, fit: object | null) {
 await page.route('**/api/catalog', (route) => route.fulfill({ json: { products: products.map((p: any) => ({ sku: p.sku, slug: p.slug, nome_produto: p.name, marca: p.brand, categoria: p.category, ativo: true, imagem_principal: p.image, price: 2000, card_price: null })) } }));
 await page.route('**/api/fit?**', (route) => fit ? route.fulfill({ json: fit }) : route.fulfill({ status: 503, json: { error: 'Consulta indisponível.' } }));
}
const F30 = { chassis: 'F30', matched: true, products: [{ sku: FITS.sku, status: 'compativel', notes: null, conditions: null }, { sku: COND.sku, status: 'compativel_com_condicoes', notes: null, conditions: 'Precisa de módulo.' }] };

test('naming the car in the catalog marks every card and can show only what fits', async ({ page }) => {
 await serve(page, F30);
 await page.goto('/catalogo');
 const form = page.getByRole('form', { name: 'Serve no meu carro?' });
 await form.getByLabel('Marca').selectOption('BMW');
 await form.getByLabel('Modelo').fill('320i');
 await form.getByLabel('Ano').fill('2015');
 await form.getByRole('button', { name: 'Ver o que serve' }).click();
 await expect(page.getByText('BMW 320i 2015')).toBeVisible();
 await expect(page.getByText('chassi F30')).toBeVisible();
 // A car named here jumps to its brand and to what fits.
 const only = page.getByRole('button', { name: /Só o que serve no meu carro/ });
 await expect(only).toHaveAttribute('aria-pressed', 'true');
 await expect(page.locator('main article')).toHaveCount(2);
 const fits = page.locator('main article', { hasText: FITS.name }).first();
 await expect(fits.getByText('Serve no seu carro')).toBeVisible();
 await expect(page.locator('main article', { hasText: COND.name }).first().getByText('Serve com condições')).toBeVisible();
 const href = await fits.getByRole('link', { name: /Pedir no WhatsApp/ }).getAttribute('href');
 expect(decodeURIComponent(href!)).toContain('Meu carro: BMW 320i 2015 (chassi F30); pelo site, serve no meu carro.');
 await only.click();
 expect(await page.locator('main article').count()).toBeGreaterThan(2);
 await expect(page.locator('main article').getByText('Confirmar com a equipe').first()).toBeVisible();
});

test('the product page answers for the remembered car and the buy message carries it', async ({ page }) => {
 await serve(page, F30);
 await page.addInitScript(() => localStorage.setItem('ohc-carro', JSON.stringify({ brand: 'BMW', model: '320i', year: 2015 })));
 await page.goto(`/produto/${COND.slug}`);
 const section = page.locator('section', { has: page.getByRole('heading', { name: 'Serve no seu carro?' }) });
 await expect(section.getByText('Serve com condições')).toBeVisible();
 await expect(section.getByText('Precisa de módulo.')).toBeVisible();
 const href = await page.getByRole('link', { name: 'Comprar pelo WhatsApp' }).first().getAttribute('href');
 expect(decodeURIComponent(href!)).toContain('Meu carro: BMW 320i 2015 (chassi F30); pelo site, serve com condições: Precisa de módulo.');
});

test('a car the base does not know keeps the whole catalog; a service failure shows no seals', async ({ page }) => {
 await serve(page, { chassis: null, matched: false, products: [] });
 await page.addInitScript(() => localStorage.setItem('ohc-carro', JSON.stringify({ brand: 'BMW', model: 'X9', year: 2020 })));
 await page.goto('/catalogo?marca=BMW');
 await expect(page.getByText(/ainda não tem volante confirmado/)).toBeVisible();
 await expect(page.getByRole('button', { name: /Só o que serve no meu carro/ })).toHaveCount(0);
 expect(await page.locator('main article').count()).toBe(bmw.length + products.filter((p: any) => p.brand === 'BMW' && p.category !== 'Volantes').length);
 await page.unrouteAll();
 await serve(page, null);
 await page.goto(`/produto/${FITS.slug}`);
 await expect(page.getByRole('heading', { name: 'Serve no seu carro?' })).toBeVisible();
 await expect(page.getByText('Serve no seu carro', { exact: true })).toHaveCount(0);
 const href = await page.getByRole('link', { name: 'Comprar pelo WhatsApp' }).first().getAttribute('href');
 expect(decodeURIComponent(href!)).toContain('queria confirmar se serve');
});
