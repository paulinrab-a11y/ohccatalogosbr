# OHC Motors — fonte integrada

Aplicação React 18 + Vite + TypeScript do site OHC Motors, incluindo catálogo, compatibilidade, painel administrativo e APIs server-side para Vercel.

## Estado deste pacote

Este pacote foi montado a partir do projeto local validado em setembro de 2026. Ele contém:

- frontend Vite/React;
- APIs Vercel em `api/`;
- autenticação administrativa e gestão server-side em `server/`;
- Edge Function `supabase/functions/ohc-compatibility`;
- migrations auditadas em `supabase/migrations`;
- catálogo/imagens e o modelo 3D original em `public/`;
- testes unitários, de integração e E2E.

A produção atual não deve ser substituída diretamente. Primeiro publique uma branch de **Preview**, valide CI/Vercel e só depois promova a alteração.

## Correção adicional de 28/09/2026

O carregamento do dashboard administrativo deixou de executar `cleanupExpired()` implicitamente. Limpeza de fotos expiradas continua disponível pela ação administrativa explícita `cleanup` e após o fluxo público de envio. Assim, abrir o dashboard volta a ser uma operação de leitura.

A migration `20260925110000_harden_legacy_catalog_grants.sql` mantém `SELECT` público controlado por RLS na tabela legada e remove privilégios de escrita de `anon` e `authenticated`. Ela foi validada localmente e deve ser aplicada separadamente ao Supabase de produção somente após o Preview aprovado.

## Validar

Use Node.js 24 e npm:

```sh
npm ci
npm run check
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run check` executa typecheck, lint, verificação de formatação, Knip, testes, build e scanner de segredos.

## Preview Git/Vercel

No Windows, `scripts/publicar-preview.ps1` cria uma branch temporária no repositório conectado, copia este projeto sem `.env`, `node_modules`, evidências locais ou builds e faz o push sem alterar `main`.

O `vercel.json` força o preset `vite`, `npm ci`, `npm run build` e saída `dist`. Isso é importante porque o projeto Vercel estava anteriormente associado a uma base Git diferente e configurado como Next.js.

## Variáveis

Use `.env.example` apenas como lista de nomes. Segredos server-side nunca devem receber prefixo `VITE_`.

- `SUPABASE_SERVICE_ROLE_KEY`, `OHC_EDGE_TOKEN` e `OHC_RATE_LIMIT_SECRET` são somente server-side;
- `OHC_ADMIN_EMAILS` é uma restrição adicional opcional sobre usuários que já possuem `app_metadata.role = ohc_admin`;
- `VITE_SENTRY_DSN` é opcional e publicável.

## Produção

Antes de promover um Preview:

1. CI e build Vercel precisam concluir sem erro;
2. conferir `/catalogo`, `/compatibilidade`, `/admin/login` e dashboard no Preview;
3. conferir variáveis server-side na Vercel sem expor seus valores;
4. aplicar a migration de hardening no Supabase de produção;
5. implantar a versão correspondente da Edge Function se o diff do Preview incluir a correção do dashboard;
6. manter o deployment atual disponível para rollback.

Não há declaração de “100% seguro”. A auditoria reduz riscos no escopo efetivamente testado.

## Continuidade no Claude

Leia o [CLAUDE.md](./CLAUDE.md) antes de qualquer alteração. Ele resume o estado atual de produção, as regras de autenticação cliente/admin, os testes, as pendências e o fluxo obrigatório de issue, branch e PR. O `AGENTS.md` contém o mesmo guia para outros agentes.
