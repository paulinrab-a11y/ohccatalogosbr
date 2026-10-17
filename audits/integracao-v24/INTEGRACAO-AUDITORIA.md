# OHC Motors — auditoria do candidato integrado

Data: 23/09/2026. **Candidato para homologação; lançamento ainda bloqueado.** Este documento atualiza a auditoria de 22/09 (`AUDITORIA.md`), que fica preservada como registro da primeira fase. Não houve publicação, migração, alteração de usuários ou escrita de dados em produção.

## O que foi entregue

O frontend v24 recebeu o painel e as APIs da base v21 disponibilizada anteriormente. Foram preservados os componentes visuais públicos v24, os 65 registros de referência, as imagens e o modelo 3D. O formulário voltou a registrar consulta com fotos e protocolo antes do atendimento por WhatsApp. O catálogo público agora consulta os produtos ativos do backend; falhas não republicam automaticamente o catálogo estático. A preservação visual ainda precisa de comparação no navegador.

Arquitetura do candidato: React 18 + TypeScript + Vite 6.4.3, Tailwind 3, Three/React Three Fiber/GSAP; APIs Node na Vercel; PostgreSQL, Auth OTP/link e Storage no Supabase; função `ohc-compatibility`; WhatsApp por link; Sentry opcional. Sharp 0.35.4 opera somente no servidor. Não há senhas próprias nem pagamento no código examinado.

O main remoto continua sendo outra aplicação (TanStack Start/React 19); o deployment Vercel conhecido foi enviado por CLI e não informa commit de origem. A integração usa a base v21 disponível, não uma recuperação comprovadamente idêntica do deployment. O PR de auditoria guarda patches/evidências separados para não substituir essa outra aplicação inadvertidamente.

## Correções desta continuação

- Sessões: provedor valida o token e o papel atual; RPC restrito confirma sessão existente, titular e validade. Tokens revogados/expirados e papel forjado são recusados. Refresh só grava cookies depois de validar novamente o usuário.
- Cookies e CSRF: Secure em produção, HttpOnly, SameSite=Lax, escopo host; POST exige origem exata autorizada e JSON. Logout chama revogação e limpa cookies; falha do provedor não é reportada como sucesso.
- Administração: ator obtido do servidor; alteração de papel usa o JWT do administrador e transação SQL com trava, rechecagem de papel/sessão, bloqueio de autorremoção e proteção do último administrador. Auditoria de papéis é privada.
- Abuso: contadores compartilhados no banco para envio/validação OTP e consultas. Identificadores HMAC de origem e origem+conta; sem e-mail/IP em texto claro no contador. Resposta de envio de acesso não confirma existência da conta.
- Uploads: corpo limitado a 4 MiB; até três fotos; tamanho codificado antes da alocação; decodificação completa e regravação WebP sem EXIF; até 16 MP, imagem estática, timeout de codificação e saída limitada a 2,5 MiB. Mídia administrativa aceita só WebP. Nomes gerados; exclusão limitada ao diretório administrativo. Sem varredura antimalware dedicada.
- Entradas/respostas: tipos e consentimento validados no servidor, lista permitida de campos públicos, ação pública fixada em `submit`, campos administrativos descartados; projeção pública não retorna preços privados/metadados; respostas sem cache e erros internos genéricos.
- Manutenção: painel carregado sob demanda, interfaces antigas sem uso removidas, timeout de requisições, Biome abrangendo APIs/servidor, lockfile atualizado e testes de regressão.

## Matriz dos 24 controles

“Corrigido e testado” significa **localmente**, salvo indicação expressa. Testes com Auth/Storage simulados não comprovam funcionamento desses provedores publicados. Gravidade é a prioridade do achado/risco residual, não uma afirmação de exploração.

| Item | Gravidade | Evidência | Correção / limite | Status e justificativa |
|---|---|---|---|---|
| 1. Segredos | Alta se expostos | Scan de fonte/build/histórico local sem achados; credenciais do gateway só `process.env` | `.env.example` vazio, exclusões de deploy; sem prefixo VITE para chaves privadas | **verificado** no escopo examinado; logs históricos e artefatos externos não inteiramente acessíveis |
| 2. Histórico Git | Alta se exposto | Scan por padrões do histórico local; histórico remoto alcançável inspecionado na fase anterior | Nenhum segredo privado confirmado; roteiro de rotação preservado; sem reescrita | **verificado** com limites: refs apagadas, tags não inspecionadas e serviços externos não cobertos |
| 3. Chaves públicas | Informativa | Catálogo usa chave pública; credencial de serviço isolada em Node/Edge | Projeção explícita na API; RLS/grants mantidos | **verificado** por código/permissões; cliente real em staging ainda pendente |
| 4. RLS/isolamento | Alta residual | Inspeção publicada anterior: 13/13 tabelas com RLS; réplica local executa 156 verificações CRUD com visitante/A/B | Novas tabelas privadas com RLS e sem grants ao visitante/usuário; papéis via RPC protegido | **verificado** em SQL local e configuração publicada anterior; não feito CRUD invasivo em produção |
| 5. Criptografia/PII | Média | HTTPS observado anteriormente; Storage privado, EXIF removido em teste real de imagem | Sem novos algoritmos; HMAC para limites; coleta técnica preservada | **pendente** comprovar criptografia/retencão dos backups e restauração; avaliar retenção da nova auditoria de papéis |
| 6. Autenticação | Alta | Tests gateway/Edge rejeitam expiração, sessão revogada e usuário sem papel; SQL local verifica sessão | Auth + sessão no backend em toda operação protegida | **corrigido e testado** localmente; OTP/refresh/revogação reais ainda bloqueiam publicação |
| 7. Autorização | Alta | Testes negam usuário comum, papel forjado e sessão removida; RPC de papel revalida ator | Trava transacional, ator do token, bloqueio de autorremoção e último admin | **corrigido e testado** localmente; teste de remoção sequencial após perda de papel, sem simular múltiplas conexões concorrentes reais |
| 8. Mass assignment | Média | Testes de ator/papel e projeção de entrada; mapeamento explícito no gateway/Edge | Cliente não define cargo, ator ou ação administrativa no formulário público | **corrigido e testado** nas fronteiras exercitadas; editor preserva campos autorizados ao admin |
| 9. Cookies/CSRF | Alta | Testes de atributos e recusa de Origin ausente, HTTP, externo e MIME incorreto | Origem exata + SameSite, Secure, HttpOnly; refresh com validação | **corrigido e testado** localmente; cookie/proxy real em Preview pendente |
| 10. Senhas | Baixa no candidato | UI/API usam OTP/link do Supabase; nenhum armazenamento próprio | Provedor mantém autenticação | **não aplicável** hashing próprio; confirmar métodos habilitados no provedor. Advisor anterior alertou proteção de senhas vazadas desativada |
| 11. Rate limit | Média | SQL local testa janela, limite e grants; gateway confirma 429/Retry-After e HMAC | OTP envio: 20/origem e 5/origem+conta por 15 min; validação: 60/10; público: 10/origem/min; limite global Edge permanece | **corrigido e testado** localmente; cabeçalho real Vercel e várias instâncias ainda não exercitados |
| 12. Bots | Média residual | Limites por origem/conta + limites de corpo/codificação | Controle proporcional, sem CAPTCHA visual adicional | **pendente** medir abuso/distribuição de origens; rate limit não elimina botnets |
| 13. SQL parametrizado | Baixa | SQL examinado na fase anterior sem EXECUTE dinâmico; novos RPCs usam parâmetros e search_path vazio | Sem concatenação SQL com entrada; filtros REST codificados | **verificado** por inspeção e execução das migrações em PGlite |
| 14. Entrada/XSS | Média | Testes JSON, tipos, ano, consentimento, texto longo, UUID, navegação e uploads; React escapa texto | Limites no servidor; mapas explícitos; sem HTML arbitrário | **corrigido e testado** localmente; regras técnicas automotivas mantidas nos RPCs existentes |
| 15. Vazamento/cache | Média | Testes de no-store/redação e Sentry; catálogo não retorna campos extras | Sem cache HTTP privado; erros internos genéricos; catálogo revalidado ao montar, sem fallback estático em falha | **corrigido e testado** localmente; cache efetivo entre usuários em Vercel e logs históricos pendentes |
| 16. Uploads | Média | Sharp processa pixels reais, conserva dimensões/pixels no fixture e remove EXIF; rejeita header falso, MIME, size e excesso de pixels | Decodificação + regravação sem metadados; limites; buckets preservados | **corrigido e testado** no gateway; Edge direto ainda confia na credencial interna e verifica assinatura. Storage/proxy real e análise antimalware pendentes |
| 17. Respostas API | Média residual | Projeção pública testada sem preço privado/administrador; sessão não retorna tokens | Erros genéricos; campos públicos permitidos | **pendente** tabela legada pública permite colunas amplas (zero linhas visíveis na inspeção anterior); revisar antes de aprovar/publicar registros legados |
| 18. Headers/CORS | Média | Contrato `vercel.json` testado; CSP inclui imagens do Supabase conhecido | CSP/frame-ancestors/DENY/nosniff/Referrer-Policy; origem nas APIs | **pendente** verificar cabeçalhos efetivos e integrações em navegador; CSP do bucket de staging precisa do host daquele projeto |
| 19. HTTPS | Baixa | HTTP→HTTPS/HSTS observados no domínio principal na fase anterior | Recursos locais/HTTPS; HSTS não ampliado | **verificado** na observação anterior; todas as telas/domínios ainda não verificados |
| 20. Dependências | Alta inicial | `npm ci` concluído; audit atual: 0 vulnerabilidades reportadas | Vite corrigido e Sharp fixado; lockfile preservado | **corrigido e testado** localmente; `three-mesh-bvh@0.7.8` transitive deprecated persiste, sem override incompatível |
| 21. Observabilidade | Média | SDK Sentry real testado em transporte falso com filtro de privacidade; logs mínimos no gateway | Uma solução opcional, sem replay | **pendente** configurar DSN/alerta e confirmar recebimento operacional; instalar SDK não ativa monitoramento |
| 22. Qualidade | Baixa | Tipos, lint, formato e Knip passaram | Lint também cobre APIs/servidor; sem views administrativas mortas | **corrigido e testado**; 36 avisos `any` do painel legado permanecem dívida técnica, sem erro de lint |
| 23. Testes | Alta para lançamento | 33 testes locais aprovados; 156 checks CRUD internos; 10 E2E listados | Testes Node/PGlite/Sharp/SDK e Playwright desktop/mobile com serviços fictícios | **pendente** execução E2E e fluxo completo real; navegador local bloqueado por ERR_BLOCKED_BY_CLIENT |
| 24. Pré-publicação/CI | Alta | `npm run check` e audit passaram; workflow preparado; nenhuma publicação | Commits isolados, patch e pacote completo | **pendente** CI do candidato integrado, Preview funcional, navegador móvel/desktop e homologação de migrações |

## Evidências e escopo

- `evidence/integration-install.txt`: npm ci concluído, 270 pacotes.
- `evidence/integration-check-final.txt`: tipos, lint, formatação, Knip, 33 testes, build e scanner.
- `evidence/integration-tests.txt`: 33 testes locais aprovados, zero falhas.
- `evidence/integration-npm-audit.json`: zero entradas reportadas.
- `evidence/integration-e2e-discovery.txt`: 10 testes descobertos; **não executados**.
- `tests/gateway.test.ts`, `gateway-database.test.ts`, `images.test.ts`: novas verificações; demais suítes mantidas.
- Testes de provedor são mocks com domínio `.invalid`; SQL roda em PGlite com dados fictícios. O teste de papéis confirma rechecagem após remoção, não carga concorrente de múltiplos servidores.
- Produção: somente leituras da fase anterior; RLS/grants, funções, Storage, advisor, deployment e HTTP. Nenhuma nova proteção foi confirmada em produção.
- A tentativa de abrir o preview local nesta continuação terminou em `net::ERR_BLOCKED_BY_CLIENT`. Na fase anterior, outra tentativa também foi rejeitada pela revisão automática por limite de uso. Não houve contorno desses bloqueios.

## Arquivos e commits

Commit de implementação: `847dd29` na branch `fix/1-auditoria-v24`. Inclui `api/`, `server/`, painel/login/adminApi, produtos dinâmicos, formulário, rotas/headers, dependências, configuração de qualidade, testes e migração. Commits da fase inicial: `942c725`, `46cdc16`, `555f243`, `b1a4556`.

Migrações aditivas preparadas, **não aplicadas remotamente**:

1. `20260922115606_audit_session_validation.sql`: função de consulta booleana de sessão, EXECUTE só serviço.
2. `20260922172052_audit_gateway_controls.sql`: contadores com RLS, RPC rate limit, auditoria de papel e RPC transacional de administrador. A alteração de papel só ocorre quando um admin autenticado chama o RPC; a instalação não altera papéis existentes.

O arquivo `evidence/integration-changed-files.txt` lista arquivos desta etapa. O PR remoto contém documentação e patch em pasta de auditoria; não representa uma publicação nem um merge da aplicação integrada no main.

## Bloqueadores e próximos passos concretos

1. Um Supabase de testes com schema/regra atuais e dados fictícios. O acesso disponível listou apenas o branch main; não foram criados recursos pagos. Credenciais de staging não estão disponíveis.
2. Aplicar ambas as migrações e Edge nesse ambiente, configurar variáveis **somente servidor**, executar OTP/refresh/logout real, papel revogado, dois administradores, Upload/Storage e cleanup. A migração usa `auth.users/auth.sessions`; validar contra a versão real do Auth antes da produção.
3. Preview Vercel com o candidato e esse Supabase. Confirmar empacotamento nativo do Sharp, limite do proxy, CSP, cookies, cabeçalhos IP e regravação de fotos reais não sensíveis.
4. Executar os 10 E2E e verificar visualmente desktop/celular/3D/painel. Validar também o admin completo com serviços reais, pois os E2E preparados cobrem contratos de UI simulados.
5. Resolver projeção pública legada antes de liberar novas linhas, comprovar backup/restauração e ativar alerta operacional. Confirmar a correspondência das funções de negócio do candidato com o site vigente.

Acesso conectado de leitura não equivale a credenciais de runtime de staging. Não envie chaves privadas por mensagem. Use variáveis protegidas no ambiente de homologação. Passos de publicação/reversão estão em `PUBLICACAO-INTEGRADA.md`.

## Documentação oficial consultada

- Sharp: https://sharp.pixelplumbing.com/api-constructor/ e https://sharp.pixelplumbing.com/api-output/ — decodificação, limites, timeout e remoção de metadados.
- Vercel: https://vercel.com/docs/headers/request-headers — cabeçalhos de origem/IP sobrescritos pela plataforma.
- Supabase: https://supabase.com/docs/guides/auth/sessions e https://supabase.com/docs/guides/database/postgres/row-level-security — sessões, RLS e credenciais privilegiadas.
- React: https://react.dev/reference/react — efeitos e carregamento sob demanda; orientações da skill React Best Practices aplicadas à revisão.

As fontes complementares e evidências da primeira fase permanecem em `AUDITORIA.md`. Segurança depende também de implantação/configuração e operação; os resultados locais não justificam afirmar que o sistema está 100% seguro.
