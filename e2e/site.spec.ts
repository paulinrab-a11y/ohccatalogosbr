import { test,expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url),'utf8'));
// UI contracts only: synthetic services, no production writes or external messages.
test.beforeEach(async ({page}) => {
 await page.route('**/api/catalog', route=>route.fulfill({json:{products:products.map(p=>({sku:p.sku,nome_produto:p.name,marca:p.brand,categoria:p.category,ativo:true,imagem_principal:p.image}))}}));
 await page.route('**/api/admin/**',route=>route.fulfill({status:401,json:{error:'Sessão administrativa inválida ou expirada.'}}));
});
test('catalog, original product image, detail and compatibility selection',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/catalogo');await expect(page.getByRole('heading',{name:/catálogo/i}).first()).toBeVisible();
 const first=page.locator('a[href^="/produto/"]').first();await expect(first).toBeVisible();await first.click();
 await expect(page).toHaveURL(/\/produto\/[^/?]+$/);await expect(page.locator('h1')).toBeVisible();
 await page.getByRole('link',{name:/compatibilidade/i}).last().click();await expect(page).toHaveURL(/\/compatibilidade/);
 expect(errors).toEqual([]);
});
test('legacy product links with ?sku= still open the product page',async({page})=>{
 await page.goto(`/produto?sku=${encodeURIComponent(products[0].sku)}`);await expect(page.locator('h1')).toContainText(products[0].name);
});
test('synthetic photo submission creates protocol and WhatsApp link without sending a message',async({page})=>{
 await page.route('**/api/requests', async route=>{
  const data=route.request().postDataJSON();expect(data.consent_data_images).toBe(true);expect(data.files).toHaveLength(1);
  await route.fulfill({status:201,json:{protocol:'OHC-SYNTHETIC'}});
 });
 await page.goto('/compatibilidade');await page.getByLabel('Marca',{exact:true}).fill('Marca fictícia');await page.getByLabel('Modelo',{exact:true}).fill('Teste');await page.getByLabel('Ano',{exact:true}).fill('2025');
 await page.getByLabel('Fotos técnicas').setInputFiles('e2e/fixtures/photo.png');
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Enviar para análise'}).click();
 await expect(page.getByText('OHC-SYNTHETIC',{exact:true})).toBeVisible();
 const link=page.getByRole('link',{name:'Continuar atendimento no WhatsApp'});await expect(link).toHaveAttribute('rel','noopener');
 expect(new URL((await link.getAttribute('href'))!).searchParams.get('text')).toContain('OHC-SYNTHETIC');
});
test('mobile menu, responsive width and browser back navigation',async({page,isMobile})=>{
 await page.goto('/compatibilidade');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(isMobile){await page.getByRole('button',{name:'Abrir menu'}).click();await expect(page.getByRole('navigation',{name:'Navegação móvel'})).toBeVisible();await page.getByRole('navigation',{name:'Navegação móvel'}).getByRole('link',{name:'Catálogo',exact:false}).click();await expect(page).toHaveURL(/catalogo/);await page.goBack();await expect(page).toHaveURL(/compatibilidade/);}
});
test('unknown product and unknown route fail safely',async({page})=>{
 await page.goto('/produto?sku=synthetic-missing');await expect(page.getByText(/não encontrado/i).first()).toBeVisible();
 await page.goto('/rota-inexistente');await expect(page.getByText(/não encontrad/i).first()).toBeVisible();
});
test('direct admin navigation redirects unauthenticated visitor to login',async({page})=>{
 await page.goto('/admin');await expect(page).toHaveURL(/\/admin\/login/);await expect(page.getByLabel('E-mail autorizado')).toBeVisible();
});
test('leaving a product page drops its Product JSON-LD and canonical',async({page})=>{
 await page.goto(`/produto?sku=${encodeURIComponent(products[0].sku)}`);await expect(page.locator('h1')).toContainText(products[0].name);
 await expect.poll(()=>page.locator('script[type="application/ld+json"]').allTextContents()).toEqual(expect.arrayContaining([expect.stringContaining('"Product"')]));
 await page.getByRole('link',{name:/compatibilidade/i}).last().click();await expect(page).toHaveURL(/\/compatibilidade/);
 expect((await page.locator('script[type="application/ld+json"]').allTextContents()).join('')).not.toContain('"Product"');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://www.ohcmotorsbr.com.br/compatibilidade');
});
