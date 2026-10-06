import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
// UI contracts only: synthetic services, no production writes or external messages.
test.beforeEach(async ({ page }) => {
 await page.route('**/api/catalog', (route) => route.fulfill({ json: { products: products.map((p: any) => ({ sku: p.sku, nome_produto: p.name, marca: p.brand, categoria: p.category, ativo: true, imagem_principal: p.image })) } }));
 await page.route('**/api/admin/**', (route) => route.fulfill({ status: 401, json: { error: 'Sessão administrativa inválida ou expirada.' } }));
});
test('home and account pages still render when the browser blocks sessionStorage', async ({ page }) => {
 const errors: string[] = [];
 page.on('pageerror', (e) => errors.push(e.message));
 await page.addInitScript(() => {
  Object.defineProperty(window, 'sessionStorage', { configurable: true, get() { throw new DOMException('blocked', 'SecurityError'); } });
 });
 await page.goto('/');
 await expect(page.locator('h1').first()).toBeVisible();
 await page.route('**/api/customer-config', (r) => r.fulfill({ json: { url: 'https://synthetic.supabase.co', publishableKey: 'sb_publishable_synthetic' } }));
 await page.route('https://synthetic.supabase.co/**', (r) => r.fulfill({ status: 401, json: {} }));
 await page.goto('/conta/confirmar');
 await expect(page.getByLabel('Código de ativação')).toBeVisible();
 expect(errors).toEqual([]);
});
test('desktop menu marks the current section', async ({ page, isMobile }) => {
 test.skip(isMobile, 'the desktop menu is hidden on small screens');
 await page.setViewportSize({ width: 1400, height: 900 });
 await page.goto('/catalogo?categoria=Volantes');
 const nav = page.getByRole('navigation', { name: 'Navegação', exact: true });
 await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
});
