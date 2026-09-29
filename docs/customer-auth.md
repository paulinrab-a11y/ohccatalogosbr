# Conta de cliente OHC Motors

Issue #4. Baseline: `4f907a677dc7452d51ba2b0f33542fb1e9402e9e`.

## Arquitetura

Vite + React e roteador existente. `/conta`, `/conta/criar`, `/conta/recuperar`, `/conta/confirmar`, `/conta/redefinir` e `/minha-conta` são carregados sob demanda. Um cliente Supabase com storageKey exclusivo `ohc-customer-<host>` gerencia persistência, refresh e eventos. Uma única subscription por aplicação, com cleanup no HMR; assinantes React removidos no unmount. `detectSessionInUrl=false` impede capturar links do admin. Callbacks de cliente usam PKCE, removem parâmetros da URL e fazem uma única troca por carregamento, inclusive sob StrictMode. Links devem ser abertos no navegador que iniciou o fluxo.

O nome é apenas `user_metadata.full_name`, texto apresentado pelo React, sem HTML. Não se cria tabela de perfis para três campos já disponíveis no Auth: nome, e-mail e confirmação. Nenhuma migration é necessária. Futuras entidades (pedidos, endereços etc.) precisarão de tabelas próprias, políticas por `auth.uid()` e testes entre usuários A/B.

As APIs administrativas, cookies HttpOnly, migrations e Edge Function permanecem intactos. Um token de cliente, mesmo colocado no cookie admin ou acompanhado de `user_metadata.role`, não passa por `getAuthUser`. Entrar como cliente não estabelece sessão administrativa. Sair da conta usa scope local e não encerra sessões administrativas independentes.

## Configuração

`GET /api/customer-config` retorna somente URL e chave pública. Rejeita `sb_secret_*`, JWT service_role e URLs fora do domínio Supabase. Usa valores do servidor, sem novas variáveis VITE e sem colocar segredo no bundle.

Em produção, após autorização, pode reutilizar `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` (ou `SUPABASE_ANON_KEY`). Em Preview são obrigatórias variáveis **apenas para Preview e preferencialmente para esta branch**:

- `OHC_CUSTOMER_SUPABASE_URL`: URL real de um projeto de desenvolvimento, diferente do backend de produção.
- `OHC_CUSTOMER_PUBLISHABLE_KEY`: chave publishable do mesmo projeto.

Sem essas variáveis, Preview mostra indisponibilidade e não permite criar usuários em produção. Não foram alteradas variáveis nem configurações Auth reais nesta tarefa.

No Auth de desenvolvimento, verificar antes do teste real:

1. Provider e-mail e signup habilitados; confirmação de e-mail habilitada; SMTP configurado para destinatário controlado.
2. Política de senha no servidor com mínimo de 12 caracteres. A validação de frontend não impõe política ao endpoint público Supabase.
3. Redirect URLs exatas `<preview>/conta/confirmar` e `<preview>/conta/redefinir`. Não usar wildcard global `*.vercel.app` nem destino recebido por query string.
4. Site URL do ambiente de desenvolvimento; templates usando a URL de confirmação gerada pelo Auth. A URL do Preview é protegida pela Vercel: abrir pela sessão autorizada, sem remover proteção.
5. Rate limits reais de signup, token, recover e envio de e-mails; CAPTCHA no provider se o volume de abuso exigir. Não há endpoint próprio para envio de e-mail e não há rate limit fictício de frontend. O Supabase aplica as proteções diretamente à origem do navegador.

Antes de uma futura publicação autorizada: Site URL `https://www.ohcmotorsbr.com.br`, redirects exatos `https://www.ohcmotorsbr.com.br/conta/confirmar` e `/conta/redefinir`, preservando TODOS os redirects administrativos. Revisar política e SMTP também em produção, sem alterações silenciosas.

## Segurança e limites

- `user_metadata` não autoriza acesso. O Supabase impede edição de app_metadata pelo cliente; o gateway exige a role do servidor e sessão ativa. Testes locais exercitam gateway e RLS existente, não substituem teste real do provider.
- SDK persiste tokens no armazenamento local. Esse é o modelo browser do Supabase e depende da prevenção de XSS. Sem HTML arbitrário; CSP `script-src 'self'`, sem scripts externos; telemetry existente remove URLs, tokens, usuários e breadcrumbs.
- A CSP permite conexões HTTPS ao serviço Supabase para suportar o projeto de Preview. Nenhum wildcard de scripts foi adicionado.
- Não há cookies de cliente enviados automaticamente a endpoints próprios, portanto não há mutações de cliente autenticadas por cookie sujeitas a CSRF. Admin mantém proteção de origem e JSON existente.
- Links de e-mail têm destinos fixos na origem atual; Supabase deve aplicar allowlist exata. Parâmetro `next` nunca é usado.
- Mensagens de recuperação e cadastro não distinguem conta existente. Erros brutos nunca são mostrados nem enviados à telemetria.
- Testes não enviam e-mails reais nem criam contas em produção.

## Evidência inicial da auditoria remota

- `main` idêntica ao baseline.
- Deployment de produção informado READY e associado ao baseline.
- Banco: 15 tabelas públicas com RLS; anon/authenticated somente SELECT nas duas tabelas públicas de catálogo; sem trigger adicional em auth.users.
- Mecanismos audit_session_validation e audit_gateway_controls presentes; grants das funções privilegiadas revisados.
- Projeto Supabase conectado só tem branch main; nenhum ambiente separado disponível.
- Connector Vercel informa proteção SSO de Preview. Não expõe operação de leitura/edição de env nem configuração Auth do Supabase.

## Validação e pendências

Validação local em 29/09/2026: `npm ci` passou; `npm run check` passou (39 testes, typecheck, lint, build, knip e scan de segredos); `npm audit --audit-level=high` informou zero vulnerabilidades. E2E: 30 testes passaram em Chromium 153, com configuração local apontando para o executável disponível no executor. O CI usa a instalação padrão do Playwright. Inspeção visual local em 1280 e 390 px, sem exceções JavaScript nessas páginas. Preview remoto e Auth real ainda pendentes.

E2E usa SDK real com HTTP interceptado: login, cadastro, recuperação, confirmação PKCE, redefinição, persistência, logout, erro de sessão, menu e larguras 360/390/430/768/1280. Testes de autorização executam os handlers reais do admin com provider sintético e banco PostgreSQL local via PGlite.

Para concluir a entrega funcional, faltam ambiente Auth separado, variáveis Preview, leitura/configuração de redirects e teste real de entrega de e-mail/callback/recuperação, além de regressão administrativa real com conta autorizada. Não considerar esses itens aprovados apenas pelos mocks. Não fazer merge ou promover deployment antes disso e da autorização do dono.
