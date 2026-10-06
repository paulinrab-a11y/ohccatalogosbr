import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
const file = process.env.OHC_LOCAL_AUTH_STATUS;
if (!file) throw new Error('OHC_LOCAL_AUTH_STATUS must reference local Supabase status JSON.');
const status = JSON.parse(readFileSync(file, 'utf8'));
const apiUrl = status.API_URL;
const publicKey = status.PUBLISHABLE_KEY || status.ANON_KEY;
if (apiUrl !== 'http://127.0.0.1:54321' || !publicKey) throw new Error('Only the isolated loopback Supabase stack is allowed.');
const inbox = 'http://127.0.0.1:54324';
async function emailLink(email: string, type: string) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const r = await fetch(`${inbox}/view/latest.html?query=${encodeURIComponent(`to:${email}`)}`);
    if (r.ok) {
      const html = await r.text();
      for (const match of html.matchAll(/href="([^"]+)"/g)) {
        const candidate = match[1].replaceAll('&amp;', '&');
        const url = new URL(candidate, apiUrl);
        if (url.origin === apiUrl && url.pathname === '/auth/v1/verify' && url.searchParams.get('type') === type) return url.href;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Local SMTP capture did not receive the ${type} email.`);
}
async function emailCode(email: string) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const r = await fetch(`${inbox}/view/latest.html?query=${encodeURIComponent(`to:${email}`)}`);
    if (r.ok) {
      const html = await r.text();
      const match = html.match(/id="activation-code">\s*(\d{6,8})\s*</);
      if (match) return match[1];
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Local SMTP capture did not receive the signup code.');
}
test.beforeEach(async ({ page }) => {
  // Only the public config and unrelated catalog are fixtures. Auth HTTP and SMTP are real.
  await page.route('**/api/customer-config', r => r.fulfill({json:{url:apiUrl,publishableKey:publicKey}}));
  await page.route('**/api/catalog', r => r.fulfill({json:{products:[]}}));
  await page.route('https://*.supabase.co/**', r => r.abort());
});
test('real Auth and local SMTP complete signup, OTP, login, recovery, reset and logout', async ({page}) => {
  const email = `customer-${randomUUID()}@example.test`;
  const password = 'Frase local original 123!';
  const nextPassword = 'Frase local renovada 456!';
  await page.goto('/conta/criar');
  await page.getByLabel('Nome completo').fill('Cliente Integração');
  await page.getByLabel('E-mail',{exact:true}).fill(email);
  await page.getByLabel('Senha',{exact:true}).fill(password);
  await page.getByLabel('Confirmar senha').fill(password);
  await page.getByRole('button',{name:'CRIAR CONTA',exact:true}).click();
  await expect(page).toHaveURL(/\/conta\/confirmar$/);
  await page.goto('/conta');
  await page.getByLabel('E-mail',{exact:true}).fill(email);
  await page.getByLabel('Senha',{exact:true}).fill(password);
  await page.getByRole('button',{name:'ENTRAR',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Confirme');
  const code = await emailCode(email);
  // A fresh browser context has no signup PKCE verifier or pending email storage.
  const fresh = await page.context().browser()!.newContext();
  const confirmation = await fresh.newPage();
  await confirmation.route('**/api/customer-config', r => r.fulfill({json:{url:apiUrl,publishableKey:publicKey}}));
  await confirmation.route('**/api/catalog', r => r.fulfill({json:{products:[]}}));
  await confirmation.goto('http://127.0.0.1:4173/conta/confirmar');
  await confirmation.getByLabel('E-mail do cadastro').fill(email);
  await confirmation.getByLabel('Código de ativação').fill(code);
  await confirmation.getByRole('button',{name:'CONFIRMAR E-MAIL'}).click();
  await expect(confirmation).toHaveURL(/\/minha-conta$/);
  await fresh.close();
  await page.goto('/conta/confirmar');
  await page.getByLabel('E-mail do cadastro').fill(email);
  await page.getByLabel('Código de ativação').fill(code);
  await page.getByRole('button',{name:'CONFIRMAR E-MAIL'}).click();
  await expect(page.getByRole('alert')).toContainText('Código inválido');
  await page.goto('/conta');
  await page.getByLabel('E-mail',{exact:true}).fill(email);
  await page.getByLabel('Senha',{exact:true}).fill(password);
  await page.getByRole('button',{name:'ENTRAR',exact:true}).click();
  await expect(page).toHaveURL(/\/minha-conta$/);
  await expect(page.getByText(email,{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByText(email,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Sair da conta'}).click();
  await expect(page).toHaveURL(/\/conta$/);
  await page.getByLabel('E-mail',{exact:true}).fill(email);
  await page.getByLabel('Senha',{exact:true}).fill(password);
  await page.getByRole('button',{name:'ENTRAR',exact:true}).click();
  await expect(page).toHaveURL(/\/minha-conta$/);
  await page.getByRole('button',{name:'Sair da conta'}).click();
  await expect(page).toHaveURL(/\/conta$/);
  await page.goto('/conta/recuperar');
  await page.getByLabel('E-mail',{exact:true}).fill(email);
  await page.getByRole('button',{name:'ENVIAR INSTRUÇÕES'}).click();
  await expect(page.getByRole('status')).toContainText('Se existir uma conta');
  await page.goto(await emailLink(email, 'recovery'));
  await page.getByLabel('Nova senha',{exact:true}).fill(nextPassword);
  await page.getByLabel('Confirmar senha').fill(nextPassword);
  await page.getByRole('button',{name:'SALVAR NOVA SENHA'}).click();
  await expect(page.getByRole('status')).toContainText('Senha atualizada com sucesso.');
  await page.getByRole('link',{name:'Ir para minha conta'}).click();
  await page.getByRole('button',{name:'Sair da conta'}).click();
  await expect(page).toHaveURL(/\/conta$/);
  await page.getByLabel('E-mail',{exact:true}).fill(email);
  await page.getByLabel('Senha',{exact:true}).fill(password);
  await page.getByRole('button',{name:'ENTRAR',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos.');
  await page.getByLabel('Senha',{exact:true}).fill(nextPassword);
  await page.getByRole('button',{name:'ENTRAR',exact:true}).click();
  await expect(page).toHaveURL(/\/minha-conta$/);
  await page.getByRole('button',{name:'Sair da conta'}).click();
  await expect(page).toHaveURL(/\/conta$/);
  await page.goto('/minha-conta');
  await expect(page).toHaveURL(/\/conta$/);
});
