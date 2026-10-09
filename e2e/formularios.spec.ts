import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
// UI contracts only: synthetic services, no production writes or external messages.
test.beforeEach(async ({ page }) => {
 await page.route('**/api/catalog', (route) => route.fulfill({ json: { products: products.map((p: any) => ({ sku: p.sku, nome_produto: p.name, marca: p.brand, categoria: p.category, ativo: true, imagem_principal: p.image })) } }));
});
async function fillVehicle(page: import('@playwright/test').Page) {
 await page.goto('/compatibilidade');
 await page.getByLabel('Marca', { exact: true }).fill('Marca fictícia');
 await page.getByLabel('Modelo', { exact: true }).fill('Teste');
 await page.getByLabel('Ano', { exact: true }).fill('2025');
}
test('a submit error receives focus so it is announced and visible', async ({ page }) => {
 await fillVehicle(page);
 await page.getByRole('checkbox').check();
 await page.getByRole('button', { name: 'Enviar para análise' }).click();
 await expect(page.getByRole('alert')).toBeFocused();
});
test('after a successful submit the protocol heading receives focus', async ({ page }) => {
 await page.route('**/api/requests', (route) => route.fulfill({ status: 201, json: { protocol: 'OHC-SYNTHETIC' } }));
 await fillVehicle(page);
 await page.getByLabel('Fotos técnicas').setInputFiles('e2e/fixtures/photo.png');
 await page.getByRole('checkbox').check();
 await page.getByRole('button', { name: 'Enviar para análise' }).click();
 await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});
test('closed FAQ answers are hidden from assistive technology', async ({ page }) => {
 await page.goto('/');
 const second = page.getByRole('button', { name: 'Vocês fazem a instalação?' });
 await expect(second).toHaveAttribute('aria-expanded', 'false');
 const panel = page.locator(`#${await second.getAttribute('aria-controls')}`);
 await expect(panel).toHaveAttribute('inert', '');
 await second.click();
 await expect(panel).not.toHaveAttribute('inert', '');
});
