# Conta de cliente sem nova contratação

Ref #4. Pesquisa e situação verificadas em 01/10/2026. O usuário recusou a branch paga; não criar branches pagas, upgrades ou serviços cobrados.

## Decisão

Supabase Auth continua cuidando das contas. Mailjet é a opção preferida para entregar os e-mails, pois o usuário já utiliza o serviço em outro site. SMTP não substitui o banco ou o mecanismo de autenticação e não exige trocar o SDK da aplicação.

O projeto existente pode atender clientes e administradores com a separação de autorização já implementada. Um segundo projeto hospedado é uma opção de isolamento para teste, não uma exigência de funcionamento do cadastro.

## Alternativas verificadas

| Opção | Custo e uso | Situação |
| --- | --- | --- |
| Supabase local + Mailpit no GitHub Actions | Runner padrão gratuito em repositório público; sem projeto Supabase cloud ou conta SMTP externa | Workflow `auth-local.yml` aprovado; execução 36605142890 no commit `8b217d3` |
| Novo projeto Supabase Free | Consulta do plugin retornou US$ 0/mês | Projeto `teste` criado no plano Free para o Preview isolado; id `tayvnfaxbbkjryhnxznc`, região `us-east-1`, status saudável |
| Supabase existente + SMTP Mailjet | Sem nova contratação, respeitando os limites das contas | Configurado no projeto existente; acesso administrativo validado no deployment de produção. Fluxo de cliente ainda aguarda Preview Auth separado e destinatário de teste. |
| Mailjet Free | 6.000 e-mails/mês, máximo 200/dia | Primeira opção por já ser usada pelo usuário; não foi inspecionada a conta Mailjet |
| Brevo Free | 300 e-mails/dia | Alternativa SMTP se necessária |
| Resend Free | 3.000 e-mails/mês, máximo 100/dia | Alternativa SMTP se necessária |

O SMTP padrão do Supabase limita os destinatários aos membros do projeto e atualmente permite somente dois e-mails/hora. Não é a opção para cadastros de clientes em produção.

## Teste real isolado

A configuração `tests/auth-local/supabase/config.toml` foi inicializada pelo CLI 2.118.0. Não está vinculada a projeto remoto e não aplica migrations do diretório Supabase de produção. Mantém confirmação de e-mail, senha mínima de 12 caracteres, rotação de refresh tokens e redirects exatos locais.

O workflow instala o CLI fixado, inicia Postgres/Auth/Mailpit em Docker, executa `e2e-real/customer-auth.spec.ts` e remove os volumes locais ao terminar. Não usa secrets de produção. O teste aceita somente a API `http://127.0.0.1:54321`; o endpoint de configuração e o catálogo são fixtures, mas o Auth, os tokens PKCE e o SMTP são reais. Mensagens são capturadas localmente, sem entrega a pessoas reais. Traces, vídeos e screenshots do fluxo autenticado ficam desativados.

Cobre: cadastro, bloqueio de login sem confirmação, confirmação PKCE por e-mail, sessão após reload, login, recuperação, redefinição, rejeição da senha antiga, aceitação da nova senha e logout. Não comprova entrega externa, DNS Mailjet ou funcionamento do Preview remoto.

## Resultado verificado em 30/09/2026

- [Auth real sem cloud](https://github.com/paulinrab-a11y/ohccatalogosbr/actions/runs/36605142890): aprovado no commit `8b217d3380690925b63ebda5144c52c0b588436d`, incluindo o fluxo completo no navegador e encerramento da infraestrutura descartável.
- [CI geral](https://github.com/paulinrab-a11y/ohccatalogosbr/actions/runs/36605142789): aprovado no mesmo commit, incluindo check, auditoria de dependências e E2E.
- Preview desse commit: READY na Vercel. A disponibilidade do build não comprova configuração de Auth hospedado ou entrega externa.
- Produção continua no commit `4f907a677dc7452d51ba2b0f33542fb1e9402e9e`; variáveis seguras e SMTP foram configurados pelo proprietário. Nenhum merge foi realizado.
- O Preview deve usar `OHC_CUSTOMER_SUPABASE_URL=https://tayvnfaxbbkjryhnxznc.supabase.co` e `OHC_CUSTOMER_PUBLISHABLE_KEY` com a chave publishable do projeto `teste`. Depois de alterar variáveis no Vercel, é necessário criar um novo deployment; deployments anteriores não recebem mudanças retroativamente.
- A chave publishable é apropriada para uso no navegador; nunca usar chave `service_role`, secret key ou credencial SMTP no frontend.

## Configuração Mailjet a conferir no painel, sem expor segredos

- Host SMTP: `in-v3.mailjet.com`.
- Porta: `587` (ou a opção TLS documentada e aceita pelo painel).
- Usuário SMTP: API Key Mailjet. Senha SMTP: Secret Key Mailjet.
- Remetente: endereço autorizado da OHC, a confirmar; não inventar uma caixa postal.
- Autenticar o domínio com os registros SPF/DKIM fornecidos pelo próprio Mailjet. Preservar registros existentes e não criar dois registros SPF independentes.
- Confirmar o plano Free, a cota compartilhada com o outro site e que não há upgrade/recarga automática envolvidos.
- Desabilitar reescrita/rastreamento de links nos e-mails transacionais de autenticação, conforme orientação do Supabase.
- Não colocar credenciais SMTP no React, variáveis VITE, commits ou conversas. Inserção somente no painel/configuração segura do servidor.

Antes de alterar Auth no projeto existente, ler e preservar os redirects/templates administrativos. A autorização inicial proíbe mudar Auth de produção, portanto a adoção no projeto em uso exige autorização específica após revisar os valores atuais. O endpoint de Preview continua impedindo fallback silencioso para produção. Não enfraquecer essa proteção para resolver ausência de credenciais.

## Fontes oficiais

- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/platform/billing-faq
- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/local-development/cli/testing-and-linting
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://mailpit.axllent.org/docs/integration/
- https://www.mailjet.com/pricing/
- https://www.mailjet.com/blog/email-best-practices/how-to-use-sinch-mailjet-smtp-server/
- https://documentation.mailjet.com/hc/en-us/articles/37251169295003--Quick-Start-with-Mailjet
- https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans
- https://resend.com/pricing
