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

  // Next visit: the catalog offers the saved car when no filter is set.
  await page.goto('/catalogo');
  await page.getByRole('button', { name: /Seu carro: BMW M3/ }).click();
  await expect(page).toHaveURL(/marca=BMW/);
  // And the home picker comes back filled in.
  await page.goto('/');
  await expect(page.getByLabel('Marca').last()).toHaveValue('BMW');
});

test('the picker needs a brand before it submits', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Ver volantes' }).first();
  await expect(button).toBeDisabled();
});
