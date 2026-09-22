# Auditoria prática OHC Motors

Data: 22/09/2026. Resultado: correções implementadas e validadas localmente; **publicação do pacote no site principal bloqueada pelas pendências abaixo**. Não foi encontrada credencial privada confirmada no escopo inspecionado. Isso não prova ausência de segredos ou vulnerabilidades fora desse escopo.

## Arquitetura identificada

| Componente | Evidência efetivamente observada | Limite da conclusão |
|---|---|---|
| ZIP v24 | React 18, Vite 5 originalmente, TypeScript, Tailwind 3, GSAP, Three.js/R3F; 65 produtos JSON; formulário abre WhatsApp | Não contém APIs, autenticação ou painel administrativo |
| Candidato corrigido | React 18 mantido; Vite 6.4.3; lockfile; Sentry opcional; testes e CI | Ainda não publicado; UI/CSP não validadas no navegador |
| GitHub privado | `paulinrab-a11y/ohccatalogosbr`, main `8b61f78…`, TanStack Start/React 19/Vite 8 | É outra base de código, não o ZIP; não foi sobrescrita |
| Hospedagem | Vercel `ohc-motors-integrado`, Node 24, deployment `dpl_3KPtL623U8cTfgbYpATkuG7NvypH` READY | Framework configurado como Next.js; metadado não comprova código executado |
| Banco | Supabase/Postgres, 13 tabelas públicas com RLS; 19 funções inspecionadas | Inspeção de catálogo/grants e testes em réplica parcial local; sem testes de escrita em produção |
| Autenticação/backend | Edge Function `ohc-compatibility` versão 25; valida Bearer via Auth, cargo em `app_metadata`; também aceita token interno do gateway | OTP/cookies pertencem ao backend fora do ZIP; correspondência com checkout publicado não confirmada |
| Storage | Bucket privado de solicitações, JPG/PNG/WebP até 5 MiB; bucket público de recursos, WebP/SVG | Nenhuma política direta de Storage; serviço privilegiado faz operações; backup de objetos não confirmado |
| Integrações | WhatsApp por link, Instagram e Google Fonts no site; Supabase Auth/REST/Storage na função | Tabelas do bot de preços existem, mas não foram exercitados fluxos de mensagens ou integrações externas |

Os patches de qualidade em `docs/pr/` estavam apenas armazenados, não aplicados. Bibliotecas e textos desses patches não foram tratados como proteção ativa.

## Bloqueadores de lançamento

1. **Alta: origem do deploy divergente.** Publicar o ZIP como substituto da aplicação principal pode retirar `/admin` e APIs. Necessário checkout exato do deployment atual, integração em branch e preview completo.
2. **Alta: autorização ponta a ponta ainda não comprovada.** A checagem nova cobre Bearer direto na Edge Function. O caminho privilegiado com token interno depende da validação no gateway. OTP, cookies, CSRF, revogação por esse caminho e administração do último administrador exigem staging com usuários fictícios.
3. **Alta para liberação: testes visuais e E2E não executados.** O navegador bloqueou localhost; a tentativa de abrir o site publicado foi recusada pela revisão automática por limite de uso. Não foi uma reprovação do código. Não se contornou o bloqueio.
4. **Média: observabilidade operacional incompleta.** Captura e remoção de dados sensíveis passaram com transporte simulado; faltam DSN real, retenção, responsável e teste de entrega de alertas.
5. **Média: resiliência e abuso.** Faltam comprovar backup/restore e backup dos arquivos; o limite público global existe, mas pode ser esgotado por um único originador. Controles por origem/conta dependem da integração do gateway de staging.

## Matriz dos 24 controles

Gravidade descreve o problema ou risco residual, não uma exploração comprovada. “Corrigido e testado” nesta tabela significa **localmente**, salvo indicação explícita. “Verificado” indica apenas o escopo descrito; não significa aprovação integral de produção.

| Item | Gravidade | Evidência | Correção ou medida preparada | Status e justificativa |
|---|---|---|---|---|
| 1. Chaves e segredos atuais | Alta potencial; nenhum confirmado | Inspeção de fonte/patches, scanner de padrões em arquivos e build; chave de serviço lida por ambiente somente na função | `.gitignore`, `.vercelignore`, scanner sem imprimir valores; frontend aceita apenas DSN publicável | **verificado** no código/build disponíveis; logs e variáveis privadas do runtime não exportados |
| 2. Histórico Git | Alta potencial; nenhum confirmado | 78 commits e 380 patches do GitHub; dois arquivos grandes lidos integralmente; histórico local escaneado | Procedimento de rotação antes de eventual limpeza em `PUBLICACAO-REVERSAO.md`; nenhum force-push | **verificado** no histórico alcançável inspecionado; refs apagadas, artefatos externos e tags não cobertos |
| 3. Chaves públicas do banco | Informativa | ZIP não usa Supabase; função separa ANON e SERVICE_ROLE; grants públicos avaliados | Nenhuma chave publicável classificada como falha só por ser pública; serviço fica no servidor | **verificado** estaticamente e pelas permissões; não foi usado token de cliente real para pentest publicado |
| 4. RLS e isolamento | Alta residual no gateway | RLS 13/13; duas tabelas com SELECT filtrado; 11 privadas sem leitura direta; 156 verificações CRUD locais, visitante e usuários A/B | Réplica com tipos, políticas e grants reais e dados fictícios; preserva catálogo ativo/publicado/aprovado | **verificado** para políticas/grants e simulação local. Tabelas privadas são restritas ao backend, não um CRUD por proprietário; nenhuma escrita de teste em produção |
| 5. Criptografia e dados pessoais | Média | HTTPS observado; fotos privadas e prazo de expiração/cleanup no backend; coleta do formulário revista | Orientação para não enviar documentos/placas; telemetria minimizada e logs redigidos | **pendente** confirmar criptografia/configuração de backups e restauração; sem criptografia caseira nem alteração de dados |
| 6. Autenticação no servidor | Alta | Auth valida identidade, mas fonte original não consultava existência da sessão após logout; teste de sessão local cobre expirado, apagado e outro dono | Função SQL restrita ao serviço + checagem de `session_id/sub` após validação Auth; falha fechada | **pendente** implantação/testes de Auth real. Correção Bearer testada localmente; caminho interno continua dependente do gateway |
| 7. Autorização por ação/recurso | Alta residual | Papel vem de `app_metadata`, não `user_metadata`; mocks rejeitam usuário comum, IDs malformados e acesso anônimo | Autenticar antes de ler corpo; UUIDs validados; testes de cargo forjado e ator da decisão | **pendente** testar APIs/painel exatos, troca de IDs e último administrador em staging; token interno é credencial administrativa |
| 8. Mass assignment | Média | Payloads de decisão usam mapeamento explícito, ator obtido no servidor; teste ignora `role/owner_id/reviewed_by` forjados | Preservado mapeamento explícito; formulário v24 rejeita campos inesperados | **verificado** no formulário e função inspecionada, não em APIs ausentes do ZIP |
| 9. Cookies/CSRF | Alta potencial, não confirmada | ZIP não autentica nem cria cookies de sessão; função usa Bearer/token interno | Roteiro de teste do backend principal, origem, Secure/HttpOnly/SameSite e logout | **pendente** comprovação do gateway publicado; **não aplicável** ao frontend estático isoladamente |
| 10. Senhas | Média condicional | ZIP não armazena senha; função delega Auth; advisor informou proteção contra senhas vazadas desativada | Manter provedor; não duplicar senha ou criar hashing próprio | **pendente** confirmar se senha está habilitada além de OTP e ajustar proteção se aplicável; **não aplicável** ao ZIP |
| 11. Rate limit | Média | RPC real usa UPSERT atômico no banco, 60 por 60 s global; local aceita 60 e rejeita 61ª, reinicia após janela; 429/Retry-After testados | Limites de corpo e transporte; testes reproduzem função real | **pendente** limite por origem/conta e OTP no gateway; banco compartilhado ajuda múltiplas instâncias, mas teste não foi distribuído nem de carga |
| 12. Bots | Média | Site estático só abre WhatsApp; backend de solicitações tem contador global, sem CAPTCHA validado no código examinado | Não foi acrescentado desafio visual sem necessidade; plano de controle proporcional no gateway | **pendente** risco do endpoint público completo, sinais confiáveis de origem e validação server-side de eventual desafio |
| 13. SQL parametrizado | Baixa no escopo | 19 funções inspecionadas sem SQL dinâmico `EXECUTE`; REST/RPC enviam valores JSON; novo SQL usa argumentos tipados | UUIDs antes dos RPCs; migração com `search_path` vazio e EXECUTE só serviço | **verificado** por inspeção do SQL disponível e execução da nova função local; não inclui SQL de integrações não fornecidas |
| 14. Validação/XSS | Alta disponibilidade; média entrada | Função original fazia `request.json()` sem limite; campos e upload revisados; React escapa texto, sem HTML arbitrário no código verificado | Leitura limitada inclusive sem Content-Length, JSON/objeto/MIME, UUID, limite base64 antes de decodificar; formulário com limites e listas | **corrigido e testado** localmente, com grandes corpos sintéticos, JSON inválido e campos indevidos; regras profundas continuam nos RPCs |
| 15. Vazamento e cache | Média | Logs originais incluíam erro bruto; respostas Edge e `/api/admin/session` observado com no-store; CSP faltava na raiz publicada | Logs estruturados sem corpo/erro bruto, identificador de incidente; filtro Sentry; exclusão de artefatos do deploy | **corrigido e testado** para fonte preparada; caches entre usuários, HTML autenticado e logs históricos publicados permanecem pendentes |
| 16. Uploads | Média | Até 3 imagens, 5 MiB cada, MIME e assinatura; bucket privado; nomes de objeto gerados; URLs assinadas 600 s | Checagem de tamanho codificado antes da alocação e corpo total limitado; erros sem detalhes; cleanup não transforma consulta aceita em 500 | **pendente** decodificação completa/regravação, avaliação antimalware, limite real do proxy Vercel e fluxo Storage em staging. Assinatura não basta para declarar arquivo seguro |
| 17. Respostas API | Média latente | Projeções explícitas em lista/produtos; detalhe administrativo retorna contexto amplo; tabela legada permite SELECT de todas as colunas, mas tinha zero linhas aprovadas visíveis | Erros genéricos com ID; plano de projeção pública restrita antes de liberar linhas legadas | **pendente** revisar necessidade de `responsavel/fonte_arquivo` e demais metadados; sem exposição de conteúdo privado comprovada nessa tabela |
| 18. Cabeçalhos/CORS | Média | Raiz publicada sem CSP/X-Frame-Options na observação; nosniff existente; sem prova de CORS das APIs completas | CSP, frame-ancestors, DENY, nosniff, Referrer-Policy, Permissions-Policy; rewrites somente de rotas públicas | **pendente** headers configurados e teste de contrato local aprovado; compatibilidade real com navegador/preview e CORS não confirmados |
| 19. HTTPS | Baixa no domínio observado | HTTPS 200; HTTP 308 para HTTPS; HSTS observado max-age 63072000; recursos do código por HTTPS/locais | Sem ampliar HSTS para subdomínios; assets locais reduzem dependências | **verificado** por leitura HTTP do domínio principal; conteúdo misto em todas as telas e cobertura de outros domínios não confirmados |
| 20. Dependências | Alta inicial, corrigida localmente | Audit inicial: Vite alto + esbuild moderado; audit final: zero entradas conhecidas | Vite 6.4.3/plugin React 4.7.0, lockfile novo, npm ci; removida dependência sem uso; sem fix --force | **corrigido e testado** em build/tipos/testes; audit não prova ausência de falhas desconhecidas; migração visual ainda pendente |
| 21. Observabilidade | Média | ZIP só tinha propostas em patch; captura real do SDK testada em transporte local simulado | Sentry único e opcional, ErrorBoundary/fallback 3D, evento com lista permitida, sem replay/breadcrumbs; logs Edge estruturados | **pendente** DSN/configuração operacional e alerta real. SDK instalado não é monitoramento ativo |
| 22. Qualidade/manutenção | Baixa | Tipos estritos, Biome, Knip e diff-check passaram; componente/dependência não usados removidos | Corrigidos ciclos de vida async, limpeza de materiais/menu e resize; formatação consistente, sem mudar catálogo/regras | **corrigido e testado** por verificações locais; aviso não bloqueante de empacotamento GSAP persiste |
| 23. Testes automatizados | Alta para liberação completa | 17 testes aprovados; 156 verificações CRUD internas; 8 E2E descobertos, zero E2E executados | Suítes de autorização, sessões, upload, rate limit, entrada, navegação, telemetria e assets; Playwright desktop/mobile preparado | **pendente** E2E/admin/OTP reais. Cobertura percentual e mutação não usadas como prova de segurança; priorizados testes de fronteiras críticas |
| 24. Validação/CI/publicação | Alta | Build, tipos, lint, formato, Knip, testes e scan locais aprovados; workflow preparado | CI com npm ci/check/audit/Playwright e permissões de leitura; branch e commits isolados | **pendente** CI remoto deste candidato, preview desktop/celular, CSP e integração com backend. Não houve publicação |

## Evidências e resultados reais

| Verificação | Resultado | Arquivo |
|---|---|---|
| `npm ci` + `npm run check` | Exit 0, inclui tipos/lint/formato/Knip/17 testes/build/scan | `evidence/check-final.txt` |
| `npm test` após autenticação antes do corpo | 17 aprovados, 0 falhas, sem rede de produção | `evidence/tests.txt` |
| RLS em PGlite | 13 tabelas × 3 perfis × 4 ações = 156 verificações; dados fictícios | `tests/database.test.ts` |
| Auth mock e SQL real local | Rejeita usuário comum, sessão removida/expirada/outro dono, ator forjado; sem login real | `tests/edge.test.ts`, `tests/database.test.ts` |
| Limite de requisições | SQL original reproduzido localmente; 61 chamadas pequenas em banco local, sem carga em produção | `tests/database.test.ts` |
| Sentry | SDK capturou erro com transporte simulado; evento sem mensagem/PII fornecidas no teste | `tests/telemetry-integration.test.ts` |
| Dependências | Inicial 2; final 0 vulnerabilidades reportadas | `evidence/npm-audit-before.json`, `npm-audit-after.json` |
| Playwright | 8 casos listados: 4 desktop e 4 mobile; NÃO executados | `evidence/e2e-discovery.txt` |
| Headers publicados | Raiz HTTPS 200, HTTP 308; GET session 405 com no-store; GET `/api/compatibility` 404 | `evidence/live-*-headers.txt` |
| Segredos | Nenhum padrão confirmado; scanner não imprime valores | `evidence/secret-scan.json`, `history-review.json` |
| Preservação | Comparação semântica: 65 produtos idênticos salvo caminhos de imagem; SHA-256 do GLB igual ao original | `evidence/preservation.json` |

O GET de sessão retornar 405 **não comprova autenticação**; apenas que esse método é rejeitado. Nenhum envio de OTP, mensagem, alteração de usuário, upload, exclusão, teste de carga ou atualização de política foi realizado em produção.

A réplica PGlite reproduz tipos, RLS e grants, mas omite constraints/defaults/triggers e o gateway PostgREST/Auth/Storage. Ela prova os casos executados para essas políticas, não todo o comportamento do serviço hospedado.

A instalação limpa também sinalizou `three-mesh-bvh@0.7.8`, dependência transitiva de `@react-three/drei@9.122.0`, como descontinuada por compatibilidade com Three.js. O audit não apontou vulnerabilidade conhecida nela; não foi imposto override de versão que pudesse quebrar a cena. A migração dessa dependência e sua compatibilidade visual ficam pendentes no staging.

A build emite aviso de GSAP importado de forma estática e dinâmica; não é falha de compilação nem correção de segurança pendente. O chunk 3D tem aproximadamente 956 kB antes de gzip; performance em celular real permanece para o preview.

## Arquivos, commits e migração

Branch local: `fix/1-auditoria-v24`, criada sobre o snapshot local do ZIP (`audit/v24-original`, baseline `4b51e3c`). A branch remota com mesmo nome foi criada sobre main remoto. Os históricos têm bases diferentes e **não devem ser mesclados como se fossem a mesma aplicação**.

- `942c725`: frontend, dependências, headers, validação, telemetria, recursos originais locais, ferramentas de qualidade e CI.
- `46cdc16`: Edge Function preparada, migração aditiva e testes locais de banco/backend.
- Commit documental final e lista exata de arquivos: `COMMITS.txt` e `ARQUIVOS-ALTERADOS.txt` no pacote de entrega.

Migração preparada: `supabase/migrations/20260922115606_audit_session_validation.sql`. Não aplicada. Não altera tabelas/dados; cria uma função SECURITY DEFINER, caminho vazio, parâmetros UUID, retorno booleano e EXECUTE restrito a `service_role`. Testado que anon/authenticated não conseguem executá-la.

Principais grupos: `src/lib/{navigation,compatibility,telemetry,observability}.ts`, router, ErrorBoundary, formulário; ciclo de vida dos componentes 3D/efeitos; `vercel.json`; package/lockfile; testes; CI; função e migração Supabase. Os demais componentes tiveram principalmente formatação; `styles.css`, geometria do GLB e valores de produto foram preservados.

Issue: https://github.com/paulinrab-a11y/ohccatalogosbr/issues/1. O PR da auditoria é deliberadamente separado da aplicação principal e não deve disparar substituição de seu código.

## Acessos/configurações que faltam

- Código exato e relação Git/deployment do backend publicado; credencial Git de clone não estava disponível, embora leitura e escrita pela integração GitHub estivessem.
- Ambiente Supabase de testes com Auth/Storage e usuários fictícios autorizados; não reutilizar contas/clientes reais.
- Configuração operacional de Sentry e destinatário/responsável por alertas.
- Configuração e restauração comprovada de backups de banco e objetos; política de retenção e acesso.
- Navegador desbloqueado para preview desktop/mobile e CI executado no candidato integrado.
- Revisão das colunas públicas legadas, controle de abuso por origem/conta e limites de uploads compatíveis com o proxy.
- Autorização separada para implantação em produção, rotação se uma exposição for confirmada, mudanças de privilégios públicos ou remoção de funções. Nenhuma dessas ações foi executada.

## Documentação oficial consultada

- Vite: variáveis públicas e modos https://vite.dev/guide/env-and-mode ; migração v5→v6 https://v6.vite.dev/guide/migration
- Supabase: RLS https://supabase.com/docs/guides/database/postgres/row-level-security ; sessões/revogação https://supabase.com/docs/guides/auth/sessions ; backups https://supabase.com/docs/guides/platform/backups
- Supabase advisors: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public ; senhas https://supabase.com/docs/guides/auth/password-security
- MDN CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
- Vercel rollback: https://vercel.com/docs/cli/rollback
- SDK Sentry: tipos/opções e transporte do pacote oficial instalado inspecionados e captura local executada; a página de documentação remota de filtragem não pôde ser recuperada.

Publicação e reversão detalhadas em `PUBLICACAO-REVERSAO.md`. Esta auditoria reduz riscos no escopo testado; não certifica que o sistema está livre de vulnerabilidades.
