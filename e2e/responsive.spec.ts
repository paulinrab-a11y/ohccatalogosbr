import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
test.beforeEach(async ({page}) => {
 await page.route('**/api/catalog', r => r.fulfill({json:{products:products.map(p=>({sku:p.sku,nome_produto:p.name,marca:p.brand,categoria:p.category,ativo:true,imagem_principal:p.image}))}}));
 await page.route('**/api/customer-config', r => r.fulfill({json:{url:'https://layout-test.supabase.co',publishableKey:'sb_publishable_synthetic'}}));
});

for (const width of [320, 390, 768, 1024, 1280, 1440]) {
  test(`layout público em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    for (const path of ['/', '/catalogo', '/compatibilidade', '/conta', '/conta/criar', '/conta/recuperar', '/produto?sku=1.02.A01.00019']) {
      await page.goto(path);
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      if (path.startsWith('/conta')) await expect(page.locator('form')).toBeVisible();
      if (path.startsWith('/produto')) await expect(page.locator('h1')).toBeVisible();
      const layout = await header.evaluate((element) => {
        const controls = [...element.querySelectorAll('a,button')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
        return {
          fits: controls.every(r => r.left >= 0 && r.right <= innerWidth),
          separate: controls.every((r, i) => i === 0 || r.left >= controls[i - 1].right),
          pageFits: document.documentElement.scrollWidth <= innerWidth,
        };
      });
      expect(layout).toEqual({ fits: true, separate: true, pageFits: true });
    }
    if (width < 1280) {
      await page.getByRole('button', { name: 'Abrir menu' }).click();
      const dialog = page.getByRole('dialog', { name: 'Menu de navegação' });
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
      await expect(dialog.getByRole('link', { name: /Entrar \/ Criar conta/ })).toBeVisible();
      await page.getByRole('button', { name: 'Fechar menu' }).click();
      await expect(page.locator('[role=dialog]')).toHaveAttribute('aria-hidden', 'true');
    }
  });
}
