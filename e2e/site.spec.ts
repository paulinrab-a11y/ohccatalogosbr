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
test('product page waits for a slow catalog instead of flashing not found; missing product is noindex',async({page})=>{
 await page.route('**/api/catalog',async route=>{await new Promise(r=>setTimeout(r,1500));await route.fallback();});
 await page.goto(`/produto/${products[0].slug}`);
 await expect(page.getByText('Carregando produto…')).toBeVisible();await expect(page.getByText(/não encontrado/i)).toHaveCount(0);
 await expect(page.locator('h1')).toContainText(products[0].name);
 await page.goto('/produto/produto-sintetico-inexistente');await expect(page.getByText(/Produto não encontrado/)).toBeVisible();
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
});
test('catalog falls back to the bundled products when /api/catalog fails',async({page})=>{
 await page.route('**/api/catalog',route=>route.fulfill({status:503,json:{error:'indisponível'}}));
 await page.goto('/catalogo');await expect(page.locator('a[href^="/produto/"]').first()).toBeVisible();
 await expect(page.getByText(/Nenhum produto/)).toHaveCount(0);
});
test('product cards navigate inside the app and ?sku= preselects the product after the catalog loads',async({page})=>{
 await page.goto('/catalogo');await page.evaluate(()=>{(window as unknown as {__spa:boolean}).__spa=true;});
 await page.locator('a[href^="/produto/"]').first().click();await expect(page).toHaveURL(/\/produto\/[^/?]+$/);
 expect(await page.evaluate(()=>(window as unknown as {__spa?:boolean}).__spa)).toBe(true);
 await page.route('**/api/catalog',async route=>{await new Promise(r=>setTimeout(r,1000));await route.fallback();});
 await page.goto(`/compatibilidade?sku=${encodeURIComponent(products[0].sku)}`);await expect(page.locator('#sku')).toHaveValue(products[0].sku);
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
