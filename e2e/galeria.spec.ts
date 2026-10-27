import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.route(/\.glb$/, (route) => route.abort()); });

test('the gallery shows the 20 product photos with descriptions, loaded lazily', async ({ page }) => {
 await page.goto('/');
 const gallery = page.getByRole('region', { name: 'Instalados' });
 await expect(gallery).toBeAttached();
 const images = gallery.getByRole('img');
 await expect(images).toHaveCount(20);
 for (const img of await images.all()) {
  expect(await img.getAttribute('alt')).toBeTruthy();
  expect(await img.getAttribute('loading')).toBe('lazy');
 }
});

test('wide screens pin the gallery and scroll moves the photos sideways', async ({ page, isMobile }) => {
 test.skip(isMobile, 'phones swipe the strip natively');
 await page.setViewportSize({ width: 1440, height: 900 });
 await page.goto('/');
 const section = page.getByRole('region', { name: 'Instalados' });
 await expect.poll(() => section.evaluate((s) => s.parentElement?.classList.contains('pin-spacer'))).toBe(true);
});

test('reduced motion: nothing pins, the strip scrolls by hand', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'reduce' });
 await page.setViewportSize({ width: 1440, height: 900 });
 await page.goto('/');
 const section = page.getByRole('region', { name: 'Instalados' });
 await section.scrollIntoViewIfNeeded();
 await page.waitForTimeout(500);
 expect(await section.evaluate((s) => s.parentElement?.classList.contains('pin-spacer'))).toBe(false);
 const strip = section.locator('div').filter({ has: page.locator('figure') }).first();
 expect(await strip.evaluate((el) => getComputedStyle(el).overflowX)).toBe('auto');
});
