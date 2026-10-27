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

test('the about page is reachable from the footer and tells how to buy', async ({ page }) => {
 await page.goto('/');
 await page.getByRole('contentinfo').getByRole('link', { name: 'Quem somos' }).click();
 await expect(page).toHaveURL(/\/sobre$/);
 await expect(page.getByRole('heading', { level: 1 })).toContainText(/OHC Motors/i);
 await expect(page.getByRole('region', { name: 'Como funciona a compra' })).toBeVisible();
 await expect(page.getByRole('link', { name: '@ohcmotorsbr', exact: true })).toHaveAttribute('href', 'https://www.instagram.com/ohcmotorsbr/');
 await expect(page).toHaveTitle('Quem somos | OHC Motors');
});

test('the home asks for the year and explains how to buy', async ({ page }) => {
 await page.goto('/');
 await expect(page.getByRole('heading', { name: 'Como comprar' })).toBeVisible();
 const picker = page.getByRole('form', { name: 'Encontrar o volante do seu carro' }).last();
 await picker.getByLabel('Marca').selectOption('BMW');
 await picker.getByLabel('Modelo ou chassi (opcional)').fill('320i');
 await picker.getByLabel('Ano').fill('2015');
 await picker.getByRole('button', { name: 'Ver volantes' }).click();
 await expect(page).toHaveURL(/\/catalogo/);
 expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ohc-carro') || '{}'))).toEqual({ brand: 'BMW', model: '320i', year: 2015 });
});
