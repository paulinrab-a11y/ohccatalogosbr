# OHC Motors: instruções para agentes e desenvolvimento

Atualizado em 06/10/2026. Leia este arquivo antes de alterar o repositório.
`AGENTS.md` deve permanecer idêntico a este arquivo.

## Fonte de verdade e estado atual

- Repositório: https://github.com/paulinrab-a11y/ohccatalogosbr
- Site de produção: https://www.ohcmotorsbr.com.br
- Stack atual: Vite, React, TypeScript e Tailwind; APIs server-side em `api/`, lógica administrativa em `server/`, Supabase Auth/Edge Function e Vercel. Este é o projeto integrado em produção; não trate o site como um pacote incompleto a ser importado em outro projeto.
- Em 06/10/2026, o commit `3bf78bdb18e39cc56df07344da5d4982587cf5ea` está na `main` e o deployment de produção correspondente está READY.
- A confirmação de cadastro de clientes usa OTP por e-mail. PR #17 corrigiu o formulário para aceitar de 6 a 8 dígitos; o proprietário confirmou que o fluxo voltou a funcionar em produção.
- A branch `main` e o estado atual do GitHub sempre devem ser conferidos no começo de uma tarefa. Este resumo é um ponto de partida, não substitui verificar mudanças mais novas.
- Os documentos em `docs/` registram investigações e configurações, mas podem conter notas históricas. Prefira a anotação mais recente, confira o código e os valores atuais nos painéis antes de mudar configurações compartilhadas.

## Fluxo de trabalho obrigatório

Siga o processo deste repositório: **issue → branch → PR → deploy**.

1. Toda tarefa começa com uma issue. Se não existir, crie uma com objetivo, critérios de aceite e arquivos prováveis. Use um rótulo entre `correção`, `melhoria` ou `nova função`; acrescente área quando fizer sentido.
2. Atualize `main`, crie uma branch por issue (`fix/18-descricao`, `feat/19-descricao` ou `chore/20-descricao`) e faça commits pequenos em português.
3. Abra PR para `main` usando `.github/pull_request_template.md`, mencionando a issue com `Closes #N` ou `Ref #N`.
4. Espere CI e Preview; confira os fluxos afetados em desktop e celular. Merge somente por squash. Merge em `main` publica na Vercel. Não faça deploy manual de produção.
5. Não faça merge nem publique uma mudança futura em produção sem autorização do proprietário. O pedido explícito de publicação vale para a tarefa autorizada, não para alterações futuras.

## Autenticação e limites de segurança

- Há dois fluxos distintos: área administrativa e área de clientes. Preserve ambos.
- Clientes entram por Supabase Auth, com cadastro por e-mail/senha, OTP numérico de 6 a 8 dígitos em `/conta/confirmar`, login, recuperação e redefinição de senha, `/minha-conta` e logout.
- Recuperação de senha e links legados usam o fluxo de link/PKCE existente. Não misture tokens de cliente e administrador.
- O cliente Supabase usa storageKey próprio por host (`ohc-customer-<host>`), não captura sessão de URL do admin e o logout de cliente usa escopo local.
- O nome do cliente fica em `user_metadata.full_name`. Metadados editáveis pelo usuário nunca concedem privilégios.
- Privilégio de admin depende da autorização server-side existente (`app_metadata.role`/sessão validada). Não conceda papel de admin por cadastro, metadata de usuário, e-mail recebido do navegador ou chave pública.
- Preserve RLS, validação server-side, rate limits, cookies HttpOnly e proteções das APIs. Não crie tabelas/migrations sem necessidade.
- No Preview, mantenha a proteção que exige um Supabase de teste separado. Não redirecione Preview silenciosamente para produção. Verifique redirects, SMTP e templates antes de alterar Supabase Auth, pois algumas configurações afetam os dois fluxos.
- Nunca grave no GitHub, código frontend, logs ou conversa: senhas, tokens, chaves privadas, Mailjet Secret Key, credenciais SMTP ou `service_role`. Use nomes de variáveis e painéis seguros; não copie valores. Chave publishable pode ser pública, mas não é necessária neste guia.
- Não envie e-mails reais sem destinatário autorizado. Teste local com Supabase local/Mailpit não comprova entrega externa pelo Mailjet.

## Mapa do projeto

- `src/pages/`: páginas do catálogo, compatibilidade, conta de cliente e painel.
- `src/components/`: navegação, catálogo, formulário e componentes de interface.
- `src/data/products.json`: fonte atual dos produtos; `public/img/p/`: fotos originais otimizadas por SKU.
- `src/lib/customerAuth*` e `src/lib/customerValidation.ts`: autenticação e validação de cliente.
- `api/` e `server/`: configuração pública permitida, APIs e autorização administrativa.
- `supabase/functions/` e `supabase/migrations/`: Edge Functions e mudanças de banco.
- `tests/`: testes unitários/integrados; `e2e-real/`: fluxo real local de Auth; `docs/customer-auth.md` e `docs/customer-auth-no-cost.md`: decisões e limites detalhados.
- `public/models/steering-wheel-original.glb`: modelo 3D real. Não substituir nem redesenhar.
- Visual da marca: fundo escuro, azul e vermelho, Montserrat e Bebas Neue, logo original OHC. Manter fotos reais e características confirmadas.

## Comandos de desenvolvimento e testes

Use Node compatível com o campo `engines` do `package.json` e instale pelas versões travadas:

```sh
npm ci
npm run dev
npm run check
npm run test:e2e
```

`npm run check` executa typecheck, lint, formatação, verificação de código não usado, testes unitários, build e scanner de segredos. Para Auth real sem custo, veja `docs/customer-auth-no-cost.md` e o workflow `auth-local.yml`; ele usa Supabase local e Mailpit, sem enviar para destinatários externos.

### CI conhecido em 06/10/2026

No commit deste guia, `npm run check` e o workflow Auth real sem cloud passaram. O job geral falhou apenas em `npm audit --audit-level=high`, que reportou:
- `source-map-js` 1.0.0–1.2.1: severidade alta;
- `smol-toml` até 1.8.0: severidade moderada.

Essas ocorrências foram observadas na árvore de dependências existente; não foram corrigidas no PR #17. Antes de atualizar pacotes, identifique a cadeia com `npm explain`/relatório JSON, verifique impacto e faça uma issue/PR separado. Não rode `npm audit fix` às cegas nem declare CI totalmente verde enquanto o gate de auditoria falhar.

## Decisões e pendências do produto

- Os nove volantes recentes já têm fotos e códigos, mas os nomes ainda serão fornecidos pelo proprietário. Preserve imagens/SKUs e não invente nome, material, LED ou compatibilidade.
- Compatibilidade não é promessa automática; dúvidas devem seguir o fluxo existente com confirmação humana.
- Não ampliar o escopo para checkout, pagamento ou pedidos sem solicitação explícita.
- O crédito de rodapé “feito pela Whynot Visuals” já faz parte do site; preserve-o.
- Fale com o proprietário em português do Brasil, explique evidências reais e separe teste local, Preview e produção. Nunca afirme entrega de e-mail hospedado só porque o build ou Mailpit passou.
