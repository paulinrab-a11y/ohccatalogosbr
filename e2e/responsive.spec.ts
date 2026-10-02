import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1280, 1440]) {
  test(`layout público em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    for (const path of ['/', '/catalogo', '/compatibilidade', '/conta', '/conta/criar']) {
      await page.goto(path);
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
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
      await expect(dialog).toHaveAttribute('aria-hidden', 'true');
    }
  });
}
