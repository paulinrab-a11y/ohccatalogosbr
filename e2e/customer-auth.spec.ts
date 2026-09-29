import { test, expect, type Page } from '@playwright/test';
const origin='https://customer-test.supabase.co';
const key='ohc-customer-customer-test.supabase.co';
const uid='00000000-0000-4000-8000-000000000001';
const user={id:uid,aud:'authenticated',role:'authenticated',email:'cliente@example.invalid',email_confirmed_at:'2026-09-28T10:00:00Z',created_at:'2026-09-28T10:00:00Z',app_metadata:{provider:'email'},user_metadata:{full_name:'Cliente de Teste',role:'ohc_admin',is_admin:true,admin:true}};
function session(){const exp=Math.floor(Date.now()/1000)+3600;return {access_token:'synthetic.'+Buffer.from(JSON.stringify({sub:uid,exp,session_id:uid})).toString('base64url')+'.synthetic',refresh_token:'synthetic-refresh',token_type:'bearer',expires_in:3600,expires_at:exp,user};}
async function services(page:Page){
 await page.route('**/api/customer-config',r=>r.fulfill({json:{url:origin,publishableKey:'sb_publishable_synthetic'}}));
 await page.route('**/api/catalog',r=>r.fulfill({json:{products:[]}}));
 await page.route('**/api/admin/**',r=>r.fulfill({status:401,json:{error:'Sessão administrativa inválida ou expirada.'}}));
 await page.route(origin+'/**',async r=>{
 const url=new URL(r.request().url());
 if(url.pathname.endsWith('/user'))return r.fulfill({json:user});
 if(url.pathname.endsWith('/token'))return r.fulfill({json:session()});
 if(url.pathname.endsWith('/signup'))return r.fulfill({json:{...user,identities:[]}});
 return r.fulfill({json:{}});
 });
}
async function login(page:Page){await page.goto('/conta');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('Uma frase longa 123!');await page.getByRole('button',{name:'ENTRAR',exact:true}).click();await expect(page).toHaveURL(/\/minha-conta$/);}
test.beforeEach(async({page})=>{await services(page)});
test('protected account redirects, login persists across navigation/reload and logout removes access',async({page})=>{
 await page.goto('/minha-conta');await expect(page).toHaveURL(/\/conta$/);await login(page);
 await expect(page.getByText(user.email,{exact:true})).toBeVisible();await page.reload();await expect(page.getByText(user.email,{exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Explorar o catálogo'}).click();await expect(page).toHaveURL(/catalogo/);
 await page.goto('/minha-conta');await expect(page.getByText('Cliente de Teste',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Sair da conta'}).click();await expect(page).toHaveURL(/\/conta$/);
 await page.goto('/minha-conta');await expect(page).toHaveURL(/\/conta$/);
});
test('signup validates confirmation, prevents duplicate submit and sends only display metadata',async({page})=>{
 let count=0;
 await page.route(origin+'/auth/v1/signup**',async r=>{count++;const data=r.request().postDataJSON();expect(data.data).toEqual({full_name:'Cliente Teste'});expect(new URL(r.request().url()).searchParams.get('redirect_to')).toBe('http://127.0.0.1:4173/conta/confirmar');await new Promise(resolve=>setTimeout(resolve,250));await r.fulfill({json:user});});
 await page.goto('/conta/criar');await page.getByLabel('Nome completo').fill('  Cliente   Teste  ');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('Uma frase longa 123!');await page.getByLabel('Confirmar senha').fill('Outra frase longa');await page.getByRole('button',{name:'CRIAR CONTA'}).click();await expect(page.getByRole('alert')).toHaveText('As senhas não coincidem.');expect(count).toBe(0);
 await page.getByLabel('Confirmar senha').fill('Uma frase longa 123!');await page.getByRole('button',{name:'CRIAR CONTA'}).click();await expect(page.getByRole('button',{name:'Aguarde…'})).toBeDisabled();await expect(page.getByRole('status')).toContainText('Confira seu e-mail');expect(count).toBe(1);
});
test('invalid login has friendly error and does not expose raw provider detail',async({page})=>{
 await page.route(origin+'/auth/v1/token**',r=>r.fulfill({status:400,headers:{'x-supabase-api-version':'2024-01-01','access-control-expose-headers':'X-Supabase-Api-Version'},json:{code:'invalid_credentials',msg:'private backend detail'}}));
 await page.goto('/conta');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('errada');await page.getByRole('button',{name:'ENTRAR',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos.');await expect(page.locator('body')).not.toContainText('private backend detail');
});
test('recovery keeps account existence neutral and has fixed redirect',async({page})=>{
 await page.route(origin+'/auth/v1/recover**',r=>{expect(new URL(r.request().url()).searchParams.get('redirect_to')).toBe('http://127.0.0.1:4173/conta/redefinir');return r.fulfill({status:400,json:{code:'user_not_found',msg:'private'}})});
 await page.goto('/conta/recuperar?next=https://evil.invalid');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByRole('button',{name:'ENVIAR INSTRUÇÕES'}).click();await expect(page.getByRole('status')).toContainText('Se existir uma conta');
});
test('PKCE confirmation exchanges once, removes code and ignores external next',async({page})=>{
 let calls=0;await page.route(origin+'/auth/v1/token**',r=>{calls++;expect(r.request().postDataJSON().auth_code).toBe('synthetic-code');return r.fulfill({json:session()});});
 await page.goto('/conta/criar');
 await page.getByLabel('Nome completo').fill('Cliente Teste');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByLabel('Senha',{exact:true}).fill('Uma frase longa 123!');await page.getByLabel('Confirmar senha').fill('Uma frase longa 123!');await page.getByRole('button',{name:'CRIAR CONTA'}).click();await expect(page.getByRole('status')).toContainText('Confira seu e-mail');
 await page.goto('/conta/confirmar?code=synthetic-code&next=https://evil.invalid');await expect(page).toHaveURL(/\/minha-conta$/);await expect(page.getByText(user.email,{exact:true})).toBeVisible();expect(calls).toBe(1);
});
test('recovery callback permits password update; missing and expired links fail safely',async({page})=>{
 await page.goto('/conta/redefinir');await expect(page.getByRole('alert')).toContainText('Abra o link');await expect(page.getByLabel('Nova senha',{exact:true})).toHaveCount(0);
 await page.goto('/conta/redefinir?error=access_denied&error_description=private-token');await expect(page.getByRole('alert')).toContainText('Este link é inválido');expect(page.url()).not.toContain('private-token');
 let updates=0;await page.route(origin+'/auth/v1/user',r=>{if(r.request().method()==='PUT'){updates++;expect(r.request().postDataJSON()).toEqual({password:'Nova frase longa 456!',code_challenge:null,code_challenge_method:null});}return r.fulfill({json:user});});
 await page.goto('/conta/recuperar');await page.getByLabel('E-mail',{exact:true}).fill(user.email);await page.getByRole('button',{name:'ENVIAR INSTRUÇÕES'}).click();await expect(page.getByRole('status')).toContainText('Se existir uma conta');
 await page.goto('/conta/redefinir?code=synthetic-recovery');await page.getByLabel('Nova senha',{exact:true}).fill('Nova frase longa 456!');await page.getByLabel('Confirmar senha').fill('Nova frase longa 456!');await page.getByRole('button',{name:'SALVAR NOVA SENHA'}).click();await expect(page.getByRole('status')).toHaveText('Senha atualizada com sucesso.');expect(updates).toBe(1);
});
test('customer with forged admin metadata never receives administrative UI',async({page})=>{
 await login(page);await page.goto('/admin');await expect(page).toHaveURL(/\/admin\/login/);await expect(page.getByLabel('E-mail autorizado')).toBeVisible();await expect(page.getByText('Central administrativa',{exact:true})).toHaveCount(0);
});
test('account UI and menu fit 360,390,430,768 and desktop; keyboard escape restores focus',async({page})=>{
 for(const width of [360,390,430,768,1280]){
 await page.setViewportSize({width,height:900});await page.goto('/conta');await expect(page.getByLabel('E-mail',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width<1024){await page.getByRole('button',{name:'Abrir menu'}).click();await expect(page.getByRole('button',{name:'Fechar menu'})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Abrir menu'})).toBeFocused();await page.getByRole('button',{name:'Abrir menu'}).click();await page.getByRole('navigation',{name:'Navegação móvel'}).getByRole('link',{name:'Minha conta'}).click();await expect(page.getByRole('button',{name:'Abrir menu'})).toHaveAttribute('aria-expanded','false');expect(await page.evaluate(()=>document.body.classList.contains('menu-open'))).toBe(false);
 } else await expect(page.locator('header').getByRole('link',{name:'Entrar',exact:true})).toBeVisible();
 }
});
test('unavailable config fails closed without crashing catalog or account',async({page})=>{
 await page.route('**/api/customer-config',r=>r.fulfill({status:503,json:{error:'unavailable'}}));await page.goto('/conta');await expect(page.getByRole('alert')).toContainText('temporariamente indisponível');await expect(page.getByRole('button',{name:'ENTRAR',exact:true})).toHaveCount(0);
});
test('expired persisted session does not display private profile data',async({page})=>{
 await page.addInitScript(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:session()});
 await page.route(origin+'/auth/v1/user',r=>r.fulfill({status:401,json:{code:'bad_jwt',msg:'Expired'}}));await page.goto('/minha-conta');await expect(page).toHaveURL(/\/conta$/);await expect(page.locator('body')).not.toContainText(user.email);
});
