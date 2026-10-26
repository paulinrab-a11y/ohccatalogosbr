import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
test.beforeEach(async ({ page }) => {
  await page.route('**/api/catalog', (route) => route.fulfill({ json: { products: products.map((p: any) => ({ sku: p.sku, nome_produto: p.name, marca: p.brand, categoria: p.category, ativo: true, imagem_principal: p.image })) } }));
});

test('the car picker opens the filtered catalog and the catalog remembers the car', async ({ page }) => {
  await page.goto('/');
  const picker = page.getByRole('form', { name: 'Encontrar o volante do seu carro' }).last();
  await picker.getByLabel('Marca').selectOption('BMW');
  await picker.getByLabel('Modelo ou chassi (opcional)').fill('M3');
  await picker.getByRole('button', { name: 'Ver volantes' }).click();
  await expect(page).toHaveURL(/\/catalogo\?marca=BMW&q=M3$/);
  await expect(page.getByRole('button', { name: 'BMW 27' }).or(page.getByRole('button', { name: /^BMW/ }))).toHaveAttribute('aria-pressed', 'true');

  // Next visit: the catalog's "Serve no meu carro?" form comes back filled in,
  // asking only for the year.
  await page.goto('/catalogo');
  const fit = page.getByRole('form', { name: 'Serve no meu carro?' });
  await expect(fit.getByLabel('Marca')).toHaveValue('BMW');
  await expect(fit.getByLabel('Modelo')).toHaveValue('M3');
  await expect(fit.getByLabel('Ano')).toHaveValue('');
  // And the home picker comes back filled in.
  await page.goto('/');
  await expect(page.getByLabel('Marca').last()).toHaveValue('BMW');
});

test('the picker needs a brand before it submits', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Ver volantes' }).first();
  await expect(button).toBeDisabled();
});

test('reduced motion: the static hero keeps the car picker clear of other text', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'reduce' });
 await page.goto('/');
 const brand = page.getByRole('combobox').first();
 await expect(brand).toBeVisible();
 await expect(page.getByText('Feito pela OHC')).toBeHidden();
 // Whatever sits on the picker's centre is the picker itself, not a heading on top of it.
 const onTop = await brand.evaluate((el) => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!hit && (el === hit || el.contains(hit)); });
 expect(onTop).toBe(true);
});
