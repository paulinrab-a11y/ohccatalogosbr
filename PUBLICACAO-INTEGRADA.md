# Publicação e reversão do candidato integrado

**Não subir este candidato diretamente no site principal antes da homologação abaixo.** O pacote agora contém painel e APIs, mas as migrações, variáveis e provedores reais precisam ser validados juntos. O guia antigo `PUBLICACAO-REVERSAO.md` é histórico da fase inicial.

## Conferência local no Windows

Extraia o ZIP e entre na pasta `ohc`. Use Node 24. Execute um comando por vez no PowerShell, interrompendo em qualquer erro:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd audit --audit-level=high
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Os testes Node/PGlite usam dados fictícios e não pedem credenciais. Os E2E usam respostas de API simuladas e não enviam WhatsApp. Foram preparados, mas não executados neste ambiente. `vite dev/preview` sozinho não hospeda as APIs Node: não use catálogo vazio em Vite isolado para concluir que o backend real funciona.

## Homologação necessária

1. Preparar projeto Supabase de testes com as tabelas, RPCs e regras vigentes, usuários fictícios e buckets equivalentes. Este ZIP contém apenas as migrações incrementais da auditoria, **não** um backup completo do banco nem provisionamento de toda a aplicação.
2. Aplicar em ordem as duas migrações de `supabase/migrations/`. Instalar a Edge Function preparada nesse mesmo ambiente. Preservar o modo de verificação JWT compatível com as chaves do projeto.
3. No Preview Vercel, configurar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (ou anon), `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OHC_EDGE_TOKEN` e `OHC_RATE_LIMIT_SECRET`. Gerar esta última com pelo menos 32 bytes aleatórios; não usar uma senha reutilizada. O token interno deve corresponder ao segredo da Edge no projeto de testes. Nenhuma variável privada pode começar com `VITE_`.
4. Configurar `OHC_PUBLIC_ORIGIN` com a origem HTTPS do ambiente; incluir aliases legítimos em `OHC_ALLOWED_ORIGINS` separados por vírgula. `VERCEL_URL` é considerado automaticamente. Configurar redirects de Auth para `/admin/login`. `OHC_ADMIN_EMAILS` é opcional e adicional ao papel `ohc_admin` do provedor.
5. Ajustar apenas o host de imagens Supabase na CSP para o projeto de testes. Se configurar Sentry, usar seu DSN publicável em `VITE_SENTRY_DSN`; verificar evento filtrado e entrega do alerta.
6. Criar Preview, nunca `--prod` nesta etapa. No projeto correto, após vincular a pasta ao projeto de homologação, `npx.cmd vercel` cria deployment Preview. Confirmar framework Vite, Node 24, build `npm run build` e saída `dist`.
7. Testar catálogo, filtros, produto, 3D/fallback, formulário com 1–3 fotos/protocolo/WhatsApp, OTP/link, refresh, logout e revogação, usuário comum, edição administrativa, publicação/ocultação e auditoria de papéis. Validar Storage privado, URL assinada expirada, remoção de EXIF e cleanup. Testar mudanças de admin concorrentes em ambiente isolado e sem carga.
8. Conferir HTTPS, CSP/console, no-store, CORS, atributos de cookies e rate limit entre requisições servidas por instâncias diferentes. Não simular ataque/carga em produção.

## Liberação do site principal

Após passar pelos bloqueadores de `INTEGRACAO-AUDITORIA.md`, guardar deployment anterior, código da Edge anterior e backup recuperável; revisar diferenças contra o site vigente e o PR. Planejar janela e reversão. Só então aplicar as migrações aditivas em produção e promover a versão validada com as variáveis de produção corretas. A promoção não deve reutilizar credenciais de staging.

O repositório main atual contém outra stack; o PR de auditoria guarda patches isolados. Não fazer merge/overwrite dessa aplicação antes de resolver a origem canônica. Não existe script neste pacote que publique automaticamente em produção.

## Reversão

- Vercel: retornar ao deployment anterior registrado usando Rollback no painel do projeto correto. Verificar previamente a disponibilidade no plano. A volta remove as proteções novas, portanto restringir acesso se necessário até corrigir a falha.
- Edge: restaurar a versão anterior registrada caso o problema envolva a função. Gateway e Edge precisam ser revertidos de forma coordenada; evitar mistura não testada.
- Banco: deixar as novas funções/tabelas aditivas restritas e sem uso; não executar DROP/reset para reverter a aplicação. A migração não modifica registros de negócio existentes. Mudanças de papéis feitas posteriormente pelo painel são eventos reais e devem ser revisadas individualmente; não desfazer em massa.
- Código: usar `git revert` em branch/PR, preservando histórico. Sem force-push.
- Segredo comprovadamente exposto: revogar/rotacionar no provedor, atualizar dependentes, verificar funcionamento e só depois coordenar limpeza do histórico. Nenhuma credencial privada confirmada exigiu rotação automática nesta auditoria.
