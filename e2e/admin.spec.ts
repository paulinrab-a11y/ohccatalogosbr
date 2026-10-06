import { test, expect, type Page } from '@playwright/test';
// Admin UI contracts with synthetic responses only: no session, no backend writes.
const request = (id: string, protocol: string) => ({ id, protocol, status: 'analise_necessaria', vehicle_brand: 'Marca', vehicle_model: protocol, vehicle_year: 2020, created_at: '2026-10-01T12:00:00Z', recommended_product_skus: [] });
async function admin(page: Page, detail: (id: string) => Promise<{ status?: number; json: unknown }>, products?: { status: number; json: unknown }) {
 await page.route('**/api/catalog', (r) => r.fulfill({ json: { products: [] } }));
 await page.route('**/api/admin/me', (r) => r.fulfill({ json: { user: { email: 'admin@example.invalid', role: 'ohc_admin' } } }));
 await page.route('**/api/admin/manage', (r) => {
  const body = r.request().postDataJSON();
  if (body.action === 'products_list' && products) return r.fulfill(products);
  return r.fulfill({ status: 503, json: { error: 'Indisponível no teste.' } });
 });
 await page.route('**/api/admin/action', async (r) => {
  const body = r.request().postDataJSON();
  if (body.action === 'admin_dashboard')
   return r.fulfill({ json: { requests: [request('a', 'OHC-AAA'), request('b', 'OHC-BBB')], products: [{ id: 1, sku: 'SKU-1', nome_produto: 'Produto sintético' }], stats: { total: 2, pending: 2, compatible: 0, conditional: 0, incompatible: 0 } } });
  if (body.action === 'admin_detail') return r.fulfill(await detail(body.id));
  return r.fulfill({ status: 400, json: { error: 'Ação inesperada no teste.' } });
 });
}
test('a late detail response never fills the drawer of another request', async ({ page }) => {
 await admin(page, async (id) => {
  if (id === 'a') await new Promise((r) => setTimeout(r, 1500));
  return { json: { ok: true, request: { ...request(id, id === 'a' ? 'OHC-AAA' : 'OHC-BBB'), internal_notes: `nota ${id}` } } };
 });
 await page.goto('/admin/consultas');
 await page.getByRole('button', { name: /OHC-AAA/ }).first().click();
 await page.getByRole('button', { name: '×' }).click();
 await page.getByRole('button', { name: /OHC-BBB/ }).first().click();
 await page.waitForTimeout(2000);
 const drawer = page.locator('section').filter({ hasText: 'Análise de compatibilidade' }).last();
 await expect(drawer).toContainText('OHC-BBB');
 await expect(drawer).not.toContainText('OHC-AAA');
 expect(await drawer.locator('textarea').evaluateAll((els) => els.map((e) => (e as HTMLTextAreaElement).value))).not.toContain('nota a');
});
test('a failed detail shows the error inside the drawer instead of an endless spinner', async ({ page }) => {
 await admin(page, async () => ({ status: 503, json: { error: 'Consulta indisponível no teste.' } }));
 await page.goto('/admin/consultas');
 await page.getByRole('button', { name: /OHC-AAA/ }).first().click();
 await expect(page.locator('section').filter({ hasText: 'Análise de compatibilidade' }).last()).toContainText('Consulta indisponível no teste.');
});
test('products from the summary list cannot be edited or toggled', async ({ page }) => {
 await admin(page, async () => ({ json: {} }), { status: 503, json: { error: 'Lista completa indisponível.' } });
 await page.goto('/admin/produtos');
 await expect(page.getByText('SKU-1').first()).toBeVisible();
 await expect(page.getByRole('button', { name: 'Editar' })).toBeDisabled();
 await expect(page.getByRole('button', { name: /^(Desativar|Ativar)$/ })).toBeDisabled();
});
