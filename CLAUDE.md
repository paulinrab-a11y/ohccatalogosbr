# OHC Motors: site novo (Vite + React + TypeScript + Tailwind)

Este arquivo vale para qualquer agente, de qualquer modelo, e para pessoas. Leia antes de mexer no projeto.
`AGENTS.md` é uma cópia deste arquivo; mantenha os dois iguais.

## Fluxo de trabalho obrigatório: Issue → branch → PR → deploy

Nenhuma alteração entra em `main` sem passar por este fluxo.

1. **Toda tarefa começa com uma issue no GitHub.** Correção, melhoria ou nova função, todas. Se a tarefa chegou por conversa e não existe issue, crie a issue primeiro (`gh issue create`) e só então comece a codar.
   - Título curto, no imperativo, em português: "Corrigir enquadramento do volante no mobile".
   - Rótulo obrigatório, um destes: `correção`, `melhoria`, `nova função`. Rótulos de área quando fizer sentido: `site`, `admin`, `3d`, `dados`, `deploy`, `seo`.
   - Corpo: o que está errado ou o que se quer, critério de aceite (como saber que ficou pronto) e arquivos prováveis.
   - Uma issue por tarefa. Tarefa grande vira uma issue "guarda-chuva" com sub-issues linkadas.
2. **Uma branch por issue**, criada a partir de `main` atualizada: `fix/123-descricao-curta`, `feat/124-descricao-curta`, `chore/125-descricao-curta` (o número é o da issue).
3. **Commits pequenos e em português**, no imperativo, com o número da issue: `fix: corrige enquadramento do volante no mobile (#123)`.
4. **Abra um PR para `main`** usando o template em `.github/pull_request_template.md`. A descrição do PR **precisa mencionar a(s) issue(s)** com palavra-chave de fechamento: `Closes #123` (ou `Fixes #123`). Sem referência à issue o PR não é aceito. Se o PR resolve só parte da issue, use `Ref #123` e diga o que falta.
5. **Deploy é feito pelo PR, não pelo terminal.** A Vercel está ligada ao repositório: cada PR gera um preview (a URL aparece no próprio PR) e o merge em `main` publica em produção. Não rode `vercel --prod` à mão, exceto em emergência documentada na issue.
6. Antes de pedir revisão, o CI (`.github/workflows/ci.yml`: typecheck + build) precisa estar verde e o preview precisa ter sido aberto e conferido no celular e no desktop.
7. Merge por **squash**, apagando a branch. O merge fecha a issue automaticamente pelo `Closes #`.

Para ver o backlog: `gh issue list`. Para criar o backlog inicial: `scripts/criar-issues.sh` (idempotente; pula issues que já existem pelo título).

## Regras do produto (não negociáveis)

- **Só fotos reais dos produtos.** Nunca imagem gerada por IA no lugar de um produto. Ilustrações SVG temporárias (faróis) são placeholder até chegar a foto real.
- **Não inventar característica de produto.** Sem LED, função, material ou compatibilidade que a peça não tenha. Grade Panamericana: LED só no contorno lateral; anel e estrela não acendem. "CAN"/"LIN" só existe nos volantes Mercedes; não usar de forma genérica.
- Não escrever "airbag". O volante "vai completo".
- Compatibilidade nunca é prometida no site; é confirmada pela equipe no WhatsApp (`+55 11 95579-8211`).
- Texto em português do Brasil, sem travessões, sem frases de anúncio. Fatos, em voz direta.
- Identidade: Montserrat (texto) + Bebas Neue (títulos); azul `#214FA1`, brilho `#3B7BFF`, vermelho `#ED1C24`, fundo `#0B0D11`. Logo: "OHC" azul + "MOTORS" vermelho.

## Mapa do projeto

- `src/pages/`: `Home`, `Catalogo` (`/catalogo?marca=&categoria=&q=`), `Produto` (`/produto?sku=`), `Compatibilidade`.
- `src/components/SteeringExperience/`: herói 3D com o GLB real (`public/models/steering-wheel-original.glb`). Não recriar nem substituir o modelo. Keyframes e textos em `timeline.ts`.
- `src/data/products.json`: 65 produtos. Fotos em `public/img/p/<SKU>.webp` (1000px) e `-s.webp` (560px). É a fonte de dados do site até a integração com o Supabase.
- `src/lib/products.ts`: helpers (`PRODUCTS`, `waLink`, `brl`, `brands`).
- `public/img/volante-360.mp4`: vídeo do herói antigo; não está no zip, mantenha o arquivo no repositório.
- Componentes de terceiros com atribuição no topo do arquivo (React Bits, 21st.dev, Uiverse). Manter os comentários de origem.

## Backend (projeto principal, fora deste repositório)

O site atual em produção (`ohcmotorsbr.com.br`) é Next.js + Supabase (projeto `wlxknhgaoopycrlxygsd`). O painel `/admin` está sendo construído como pacote de arquivos para entrar nesse projeto. Regras para qualquer trabalho que toque o Supabase:

- Não recriar o projeto nem o banco. Não apagar tabelas nem dados. Nunca `DROP TABLE`, `TRUNCATE`, `DROP FUNCTION` ou reset sem autorização explícita e por escrito na issue.
- Migrations só aditivas (`CREATE IF NOT EXISTS`, `ALTER ... ADD`). Não desativar RLS.
- `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o navegador.
- O último administrador não pode remover a si mesmo.

## Comandos

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run build      # vite build
```
