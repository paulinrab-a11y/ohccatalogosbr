#!/usr/bin/env bash
# Cria os rótulos e o backlog inicial de issues no GitHub. Idempotente: pula issue cujo título já existe.
# Uso: gh auth login (uma vez), depois: scripts/criar-issues.sh
set -euo pipefail
command -v gh >/dev/null || { echo "instale o GitHub CLI: https://cli.github.com"; exit 1; }
gh repo view >/dev/null || { echo "rode dentro do repositório já publicado no GitHub"; exit 1; }

label() { gh label create "$1" --color "$2" --description "$3" --force >/dev/null; }
label "correção"   "D73A4A" "Algo está errado ou quebrado"
label "melhoria"   "0E8A16" "Existe e pode ficar melhor"
label "nova função" "1D76DB" "Algo que o site ainda não faz"
label "site"   "C5DEF5" "Site público (Vite/React)"
label "admin"  "F9D0C4" "Painel /admin (Next.js + Supabase)"
label "3d"     "BFD4F2" "Herói 3D / GLB"
label "dados"  "FEF2C0" "Produtos, fotos, preços, compatibilidade"
label "deploy" "E4E669" "Vercel, domínio, CI"
label "seo"    "D4C5F9" "SEO, metadados, performance"
label "bloqueado" "000000" "Depende de material ou decisão do Paulo"

existing="$(gh issue list --state all --limit 500 --json title --jq '.[].title')"
issue() { # título, rótulos, corpo
  if grep -Fxq "$1" <<<"$existing"; then echo "já existe: $1"; return; fi
  gh issue create --title "$1" --label "$2" --body "$3" >/dev/null && echo "criada: $1"
}

# ---------- Correções ----------
issue "Substituir ilustrações SVG dos faróis e lanternas por fotos reais" "correção,dados,bloqueado" \
"**O que está errado**
Os 9 faróis/lanternas usam SVG ilustrativo hospedado no site antigo (\`ohcmotorsbr.com.br/imagens/ilustracao-*.svg\`). Regra do projeto: só foto real de produto.

**Esperado**
Foto real recortada em \`public/img/p/<SKU>.webp\` (1000px) e \`-s.webp\` (560px), como os volantes.

**Depende de**
Paulo enviar as fotos com fundo branco/neutro."

issue "Trocar imagens das grades hospedadas no site antigo por arquivos locais recortados" "correção,dados,bloqueado" \
"**O que está errado**
As 6 grades e os 2 acessórios apontam para URLs absolutas em \`ohcmotorsbr.com.br\`. Quando o domínio migrar, as imagens somem.

**Esperado**
Fotos recortadas em \`public/img/p/\`, sem fundo branco, e \`products.json\` apontando para caminho local.

**Depende de**
Fotos das grades em fundo neutro."

issue "Preencher preço e compatibilidade dos volantes marcados como 'sob consulta'" "correção,dados,bloqueado" \
"**O que está errado**
A maioria dos 48 volantes está com \`price: null\` e \`compat: null\` em \`src/data/products.json\`, aparecendo como \"Sob consulta\".

**Esperado**
Preço e lista de compatibilidade reais, vindos do catálogo/Supabase (tabela \`product_prices\`, \`compatibility_rules\`).

**Depende de**
Export dos dados ou acesso de leitura ao Supabase."

# ---------- Melhorias ----------
issue "Ligar o repositório à Vercel e desativar o deploy manual" "melhoria,deploy" \
"**Hoje**
Deploy é feito com \`npx vercel --prod\` no terminal.

**Proposta**
Conectar o projeto Vercel \`ohc\` (time paulinrab) a este repositório: preview automático por PR, produção no merge em \`main\`. Documentado em CLAUDE.md.

**Aceite**
Abrir um PR e ver a URL de preview comentada pela Vercel; merge publica em https://ohc-seven.vercel.app."

issue "Apontar o domínio ohcmotorsbr.com.br para o projeto Vercel 'ohc'" "melhoria,deploy,bloqueado" \
"**Hoje**
O site novo responde só em ohc-seven.vercel.app; o domínio ainda aponta para o site Next.js antigo.

**Proposta**
Adicionar o domínio no projeto Vercel e ajustar o DNS. Manter redirecionamentos das URLs antigas de produto (\`/produtos/<slug>\`) para \`/produto?sku=\`.

**Aceite**
ohcmotorsbr.com.br abre o site novo com HTTPS; URLs antigas redirecionam."

issue "Versionar o vídeo volante-360.mp4 no repositório" "melhoria,deploy" \
"**Hoje**
\`public/img/volante-360.mp4\` não vem no zip e precisa ser copiado à mão antes de cada deploy.

**Proposta**
Commitar o arquivo (ou via Git LFS se passar de 50 MB) para que o deploy pelo PR já saia completo.

**Aceite**
Clone limpo + build gera o site com o vídeo."

issue "Comprimir o GLB do volante (Draco/meshopt) e reduzir draw calls" "melhoria,3d,seo" \
"**Hoje**
\`public/models/steering-wheel-original.glb\` tem 6,7 MB, 109 mil triângulos, 109 draw calls e 9 texturas PNG.

**Proposta**
Passar por \`gltf-transform\` (meshopt ou Draco, texturas em WebP/KTX2, merge de materiais iguais) sem alterar a geometria visível. Manter o arquivo original em \`public/models/\` como referência ou fora do bundle.

**Aceite**
GLB abaixo de 2,5 MB, mesma aparência no herói, tempo até o primeiro frame do 3D menor no 4G."

issue "SEO: título e descrição por página, sitemap, imagem Open Graph" "melhoria,seo" \
"**Hoje**
Só \`index.html\` tem título/descrição; \`Produto\` altera \`document.title\` no cliente.

**Proposta**
Meta por rota (produto, catálogo por marca, compatibilidade), \`sitemap.xml\` gerado no build a partir de \`products.json\`, \`robots.txt\`, imagem OG padrão. Avaliar pré-render das páginas de produto.

**Aceite**
Cada produto tem título/descrição próprios no HTML servido; sitemap lista todas as rotas."

issue "Auditoria de acessibilidade e reduced-motion" "melhoria,site" \
"**Hoje**
Loader, LightRays e 3D respeitam \`prefers-reduced-motion\` em parte; contraste de alguns textos em \`#4A5461\` é baixo.

**Proposta**
Rodar Lighthouse/axe, corrigir contraste, foco visível, rótulos ARIA, e garantir que com reduced-motion o herói mostre a foto estática.

**Aceite**
Lighthouse Acessibilidade ≥ 95 na Home, Catálogo e Produto."

issue "Adicionar Vercel Analytics e Speed Insights" "melhoria,seo" \
"**Proposta**
Instalar \`@vercel/analytics\` e \`@vercel/speed-insights\` para medir tráfego e Web Vitals sem cookies.

**Aceite**
Dados aparecendo no painel da Vercel após o deploy."

issue "Qualidade de código: Biome, commitlint, Knip e contrato de arquitetura" "melhoria,site" \
"**Proposta**
Biome (lint + formato) com hook de pre-commit; commitlint (tipo convencional, assunto em português); Knip para dependência e export sem uso; dependency-cruiser com o contrato pages → components → lib, sem ciclos. Tudo no CI.

**Aceite**
\`npm run lint\`, \`knip\` e \`depcruise\` verdes no CI; commit fora do padrão é recusado localmente."

issue "Testes: unitários (Vitest + Codecov), end-to-end (Playwright) e mutação (Stryker)" "melhoria,site" \
"**Proposta**
Vitest cobrindo \`src/lib\` (produtos, rotas) com cobertura mínima de 80% enviada ao Codecov; Playwright em desktop e Pixel 7 nos fluxos de compra (home, catálogo por marca, produto, WhatsApp, compatibilidade, cabeçalhos de segurança no preview); Stryker semanal sobre \`src/lib\`.

**Aceite**
Jobs \`testes\` e \`e2e\` verdes no PR; relatório do Codecov comentando no PR; workflow de mutação rodando na segunda."

issue "Observabilidade: Sentry, Vercel Analytics e Speed Insights com eventos de negócio" "melhoria,site,seo" \
"**Proposta**
Sentry no navegador (erros, falha do WebGL, traces a 20%) ligado só com \`VITE_SENTRY_DSN\`; Vercel Analytics + Speed Insights; \`track()\` para clique no WhatsApp (origem + SKU), envio de compatibilidade, 3D pronto/falhou. Sem dado pessoal. Datadog/New Relic ficam fora (site estático).

**Depende de**
Criar o projeto no Sentry e colocar \`VITE_SENTRY_DSN\` nas variáveis da Vercel.

**Aceite**
Erro forçado aparece no Sentry com release = commit; eventos aparecem no Analytics da Vercel."

issue "Segurança: cabeçalhos, CSP, HTTPS forçado, validação de inputs e varredura de segredos" "melhoria,site,deploy" \
"**Proposta**
Aplicar os itens do checklist de 20 pontos que valem para o site estático (ver \`docs/seguranca.md\`): CSP, HSTS preload, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP; sourcemaps ocultos; \`maxLength\`/\`pattern\`/\`clean()\` no formulário; gitleaks, \`npm audit\` e Dependabot no CI.

**Aceite**
Teste e2e de cabeçalhos passa contra o preview; securityheaders.com dá A; gitleaks verde."

issue "Segurança na Vercel: rate limit e proteção contra bots (Firewall)" "melhoria,deploy,bloqueado" \
"**Proposta**
No painel da Vercel do projeto \`ohc\`: ativar Bot Filter, regra de rate limit para \`/compatibilidade\` e \`/produto\`, Attack Challenge Mode em caso de ataque. Não dá para fazer por código neste repositório.

**Depende de**
Paulo acessar Settings → Firewall na Vercel.

**Aceite**
Regras ativas e documentadas em \`docs/seguranca.md\`."

# ---------- Novas funções ----------
issue "Carregar produtos do Supabase em vez de products.json" "nova função,site,dados" \
"**Objetivo**
O site público mostrar o mesmo catálogo que o painel administra, sem novo deploy a cada mudança de produto.

**Escopo**
Leitura pública (anon key, RLS de leitura) de \`catalog_products\`/\`product_prices\`; fallback para \`products.json\` se a chamada falhar. Sem escrita pelo site.

**Aceite**
Alterar um preço no painel reflete no site sem deploy."

issue "Formulário de compatibilidade salvando em compatibility_requests" "nova função,site,dados" \
"**Objetivo**
Além de abrir o WhatsApp, registrar a consulta no banco para a equipe responder pelo painel.

**Escopo**
Insert com anon key em \`compatibility_requests\` (status \`pendente\`), upload das 3 fotos no Storage. Continua abrindo o WhatsApp.

**Aceite**
Consulta enviada pelo site aparece na lista do painel /admin."

issue "Painel /admin: pacote base (auth, layout, migração aditiva, dashboard)" "nova função,admin" \
"**Objetivo**
Painel administrativo dentro do projeto Next.js principal, com login por magic link e proteção de rotas.

**Escopo**
\`lib/supabase/*\`, \`lib/admin/schema.ts\` e \`data.ts\`, \`middleware.ts\`, \`supabase/migrations/20260918_admin.sql\` (admin_users, admin_audit_log, site_settings, \`is_admin()\`, RLS, trigger do último owner), \`app/admin/layout.tsx\`, login e dashboard.

**Regras**
Migration só aditiva. Sem service role no navegador. Último admin não se remove. Seguir a coluna \"Painel\" de \`docs/seguranca.md\` (auth no servidor, cookies httpOnly, zod em toda action, sem mass assignment, select explícito, uploads restritos, headers e CSP no next.config).

**Aceite**
Login funciona, rota /admin bloqueada para não-admin, dashboard mostra contagens."

issue "Painel /admin: produtos (lista, novo, editar, imagens)" "nova função,admin" \
"**Escopo**
\`app/admin/produtos/page.tsx\`, \`ProductForm.tsx\`, \`[id]/page.tsx\`, \`novo/page.tsx\`; upload de imagens para o Storage; validação zod; escrita só nas colunas existentes (\`writable()\`).

**Aceite**
Criar, editar e desativar produto com registro em \`admin_audit_log\`."

issue "Painel /admin: consultas de compatibilidade (lista, detalhe, resposta, WhatsApp)" "nova função,admin" \
"**Escopo**
Lista com filtro por status (\`pendente\`, \`em_analise\`, \`respondido\`), detalhe com fotos, campo de resposta, botão que abre o WhatsApp do cliente com a resposta, e \"salvar como regra\" que pré-preenche uma regra de compatibilidade.

**Aceite**
Responder uma consulta muda o status e fica no log."

issue "Painel /admin: regras de compatibilidade (lista, filtro, ativar/desativar, nova com detecção de conflito)" "nova função,admin" \
"**Escopo**
CRUD sobre \`compatibility_rules\` sem recriar as 489 regras existentes; alerta de regra ampla; detecção de conflito com regra existente antes de salvar; toggle ativa/inativa; audit em \`compatibility_rule_audit\`.

**Aceite**
Criar regra conflitante mostra aviso e exige confirmação; nada é apagado."

issue "Painel /admin: ferramenta de compatibilidade (consultar veículo → produtos)" "nova função,admin" \
"**Escopo**
Tela onde a equipe informa marca/modelo/ano e vê quais SKUs as regras atuais retornam, com o motivo (regra que casou). Só leitura.

**Aceite**
Resultado idêntico ao que o site antigo devolve para o mesmo veículo."

issue "Painel /admin: mídia, administradores, logs, configurações e busca global" "nova função,admin" \
"**Escopo**
- Mídia: listar/subir/apagar arquivos do Storage usados pelos produtos.
- Administradores: adicionar por e-mail (convite via \`app/api/admin/invite/route.ts\`) e remover, com a regra do último owner.
- Logs: leitura de \`admin_audit_log\` com filtro por ação e usuário.
- Configurações: \`site_settings\` (WhatsApp, textos de garantia, aviso de topo).
- Busca global por SKU, nome, veículo e consulta.

**Aceite**
Cada tela funcional e registrada no log; remover o último owner é bloqueado pelo banco."

echo "pronto. veja: gh issue list"
