import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
const wheel = products.find((p: any) => p.category === 'Volantes' && p.brand === 'BMW');

test('the product page explains how the purchase goes and keeps internal notes out', async ({ page }) => {
 await page.route('**/api/catalog', (route) => route.fulfill({ json: { products: products.map((p: any) => ({ sku: p.sku, slug: p.slug, nome_produto: p.name, marca: p.brand, categoria: p.category, ativo: true, imagem_principal: p.image, compatibilidade: p.sku === wheel.sku ? 'F15/F16/F20/F30. Ano nao informado pelo fabricante: F34/F39' : null })) } }));
 await page.goto(`/produto/${wheel.slug}`);
 const steps = page.getByRole('region', { name: 'Como funciona a compra' });
 await expect(steps).toBeVisible();
 await expect(steps.getByText('Pague pelo link.')).toBeVisible();
 await expect(steps.getByText(/InfinitePay/)).toBeVisible();
 await expect(steps.getByText('Garantia de 90 dias contra defeito')).toBeVisible();
 const body = await page.locator('main, body').first().innerText();
 expect(body).not.toMatch(/airbag/i);
 expect(body).not.toMatch(/Ano nao informado/i);
});
