# Publicação e reversão

**Situação: candidato para revisão, não liberado para substituir o site principal.** Nenhuma alteração desta auditoria foi publicada e nenhum dado de produção foi modificado.

## 1. Resolver a origem da aplicação

Há três bases distintas: ZIP v24 (Vite/React 18), main de `paulinrab-a11y/ohccatalogosbr` (TanStack Start/React 19) e metadados Vercel do projeto `ohc-motors-integrado` (framework configurado Next.js). Essa configuração não comprova o framework realmente servido.

Obter o checkout exato que produziu o deployment `dpl_3KPtL623U8cTfgbYpATkuG7NvypH`, conferir APIs e painel, e integrar as correções em branch. **Não executar `vercel --prod` a partir deste ZIP.** Isso pode retirar o painel e as APIs. O PR da auditoria armazena o relatório e o patch separado, sem substituir a aplicação do repositório.

## 2. Validar o pacote no Windows

No PowerShell, dentro da pasta extraída `ohc`:

```powershell
node --version
npm.cmd ci
npm.cmd run check
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run dev
```

Use Node 24. Se um comando falhar, interrompa a publicação. Não use `npm audit fix --force`. Guarde o `package-lock.json`. Falha ECONNRESET requer corrigir a conexão e repetir `npm ci`; não prossiga com dependências incompletas.

O teste E2E usa somente servidor local, dados fictícios e uma resposta simulada do WhatsApp. Nenhuma mensagem é enviada. Os testes de banco usam PGlite em memória e não precisam de credenciais Supabase.

## 3. Staging do backend

Antes de aplicar a migração, registrar a versão atual da função e o código de rollback em controle de versão privado. Usar projeto Supabase de testes com Auth e Storage configurados e dados fictícios. Não apontar o preview para o banco de produção durante testes de escrita.

1. Aplicar somente `supabase/migrations/20260922115606_audit_session_validation.sql`. É uma função nova, sem alterar tabelas, políticas existentes ou dados. Falha se o nome já existir, evitando sobrescrita inadvertida.
2. Conferir que somente `service_role` tem EXECUTE em `ohc_audit_session_active(uuid,uuid)` e que `search_path` é vazio. A função retorna somente booleano e verifica ID da sessão, proprietário e `not_after`.
3. Publicar a Edge Function preparada em staging mantendo a configuração de verificação JWT existente. Confirmar compatibilidade dessa configuração com as chaves usadas pelo gateway.
4. Testar OTP, expiração, logout, token revogado, usuário comum, dois administradores, troca de IDs, upload válido e inválido, exclusão programada e bloqueio de remoção do último administrador.
5. O caminho com `OHC_EDGE_TOKEN` continua confiando no gateway, por compatibilidade com o backend existente. A nova checagem de sessão cobre o caminho Bearer direto. Confirmar que o gateway valida sessão e cargo antes de emitir chamadas internas administrativas, e que força `action=submit` nas chamadas públicas. Essa garantia não foi comprovada para o código exato publicado.
6. Alinhar limites de upload com a API Vercel e avaliar decodificação/regravação das imagens. Assinatura de arquivo não comprova ausência de malware ou conteúdo poliglota.

## 4. Observabilidade e preview

Criar/configurar um único projeto Sentry e seu DSN publicável. Nenhum token administrativo deve entrar no frontend. Configurar retenção curta, acesso restrito e alerta de erros; disparar um erro fictício em staging, verificar recebimento sem dados pessoais e confirmar entrega do alerta ao responsável. Isso ainda não foi executado.

Executar o CI e abrir o preview em desktop e celular. Conferir catálogo, filtros, detalhes, menu, 3D e fallback, formulário/WhatsApp, painel e APIs. Validar CSP efetiva no navegador, Google Fonts, carregamento do GLB e imagens; `vite preview` não aplica automaticamente os headers de `vercel.json`. Verificar HTTPS, CORS e `no-store` das respostas privadas no preview Vercel.

Publicar apenas após esses bloqueadores resolvidos, revisão do PR e autorização de mudança em produção. Manter o fluxo issue → branch → PR → preview → merge. Não há autorização nova para executar mudanças de banco ou produção nesta entrega.

## 5. Reversão

Frontend: guardar o deployment que estava em produção imediatamente antes da mudança. No painel Vercel, usar Instant Rollback para esse deployment. Em uma emergência autorizada, numa pasta ligada ao projeto correto, o equivalente é:

```powershell
npx.cmd vercel rollback --scope paulinrab
```

No plano Hobby, a Vercel limita a reversão ao deployment de produção anterior. Conferir essa disponibilidade antes da publicação. Para commits, usar `git revert` em uma nova branch/PR; nunca `reset --hard` ou force-push no histórico compartilhado.

Backend: restaurar primeiro o código anterior da Edge Function. A função SQL aditiva pode permanecer sem uso, restrita ao serviço; não é necessário apagar dados ou funções para reverter a aplicação. Sua remoção eventual exige autorização separada. Não usar reset de banco.

Se houver suspeita real de segredo exposto posteriormente: revogar/rotacionar primeiro no provedor; atualizar consumidores e verificar funcionamento; só então coordenar limpeza de histórico com colaboradores. Não houve credencial privada confirmada que justificasse uma rotação automática nesta auditoria.

Backups: rollback de deploy não restaura dados. Verificar backup do banco e cópia independente dos objetos Storage, retenção e teste de restauração em ambiente isolado antes de alterações futuras de dados.
