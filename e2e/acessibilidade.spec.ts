import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
// UI contracts only: synthetic services, no production writes or external messages.
test.beforeEach(async ({ page }) => {
 await page.route('**/api/catalog', (route) => route.fulfill({ json: { products: products.map((p: any) => ({ sku: p.sku, nome_produto: p.name, marca: p.brand, categoria: p.category, ativo: true, imagem_principal: p.image })) } }));
 await page.route('**/api/admin/**', (route) => route.fulfill({ status: 401, json: { error: 'Sessão administrativa inválida ou expirada.' } }));
});
test('catalog filters and search live in the URL and survive a reload', async ({ page }) => {
 await page.goto('/catalogo');
 await page.getByRole('button', { name: /^Grades/ }).click();
 await expect(page).toHaveURL(/categoria=Grades/);
 await page.getByLabel('Buscar').fill('W205');
 await expect(page).toHaveURL(/q=W205/);
 await page.reload();
 await expect(page.getByRole('button', { name: /^Grades/ })).toHaveAttribute('aria-pressed', 'true');
 await expect(page.getByLabel('Buscar')).toHaveValue('W205');
});
test('filter buttons keep keyboard focus after being pressed', async ({ page }) => {
 await page.goto('/catalogo');
 const grades = page.getByRole('button', { name: /^Grades/ });
 await grades.focus();
 await page.keyboard.press('Enter');
 await expect(grades).toBeFocused();
});
test('skip link moves focus past the header', async ({ page, isMobile }) => {
 test.skip(isMobile, 'keyboard navigation');
 await page.goto('/catalogo');
 await page.keyboard.press('Tab');
 const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
 await expect(skip).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.locator('#conteudo')).toBeFocused();
});
test('form fields use 16px text so iOS does not zoom on focus', async ({ page }) => {
 await page.goto('/compatibilidade');
 for (const id of ['#sku', '#obs']) expect(await page.locator(id).evaluate((el) => getComputedStyle(el).fontSize)).toBe('16px');
 await page.goto('/catalogo');
 expect(await page.getByLabel('Buscar').evaluate((el) => getComputedStyle(el).fontSize)).toBe('16px');
});
