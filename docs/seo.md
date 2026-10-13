# SEO do catálogo OHC Motors

Atualizado em 01/10/2026. A implementação prioriza páginas de produto rastreáveis, conteúdo real do catálogo e dados estruturados sem inventar compatibilidade, preço, avaliações ou disponibilidade.

## O que foi aplicado

- URL canônica por produto em `/produto/<slug>`.
- Título e descrição únicos por produto, usando nome, marca, aplicação, acabamento e observações. A descrição não lista carros compatíveis, não diz quem fabrica e não chama o volante de esportivo; ela sempre termina com "Confirme a compatibilidade com o seu carro antes da compra." (garantido por `tests/seo.test.ts`).
- Texto visível “Sobre este produto” na página individual.
- JSON-LD `Product` e `BreadcrumbList` nos produtos.
- JSON-LD `Organization` e `WebSite` na página inicial.
- Metadados `description`, canonical, Open Graph, Twitter Card e `robots`.
- Sitemap XML dinâmico em `/sitemap.xml`, alimentado pelos produtos públicos ativos do catálogo.
- `robots.txt` permitindo o catálogo e bloqueando áreas privadas.
- Rotas amigáveis preservam as URLs antigas com SKU para não quebrar links existentes.

## HTML por página (13/10/2026)

- O build roda `scripts/prerender.ts` depois do `vite build`. Ele grava `dist/produto/<slug>.html`, `dist/catalogo.html` e `dist/compatibilidade.html` com o próprio título, descrição, canonical, Open Graph, Twitter e JSON-LD de cada página. O `index.html` recebe o texto da início sem canonical, porque também serve de base para as outras rotas.
- Com `cleanUrls` no `vercel.json`, a Vercel entrega esses arquivos antes dos rewrites. Assim, prévias do WhatsApp e do Instagram e crawlers sem JavaScript recebem os dados certos.
- Os produtos vêm do catálogo ao vivo quando o build tem a chave pública do Supabase; sem a chave, vêm da lista empacotada. Um produto cadastrado depois do deploy abre normalmente pelo SPA e ganha o HTML próprio no deploy seguinte.
- As imagens de compartilhamento são JPG de 1200×630 (`scripts/og-images.ts`, com sharp): a foto real do produto sobre o fundo do site e a faixa da pintura, sem nada desenhado sobre a peça. A imagem padrão fica em `/og/ohc-motors.jpg`.
- O sitemap lista as fotos com URL completa e as páginas por categoria e por marca.

## Regras de conteúdo

O site só publica como fato o que existe nos dados do produto. Compatibilidade nunca é prometida na descrição: o texto sempre orienta o cliente a confirmar com a OHC pelo WhatsApp. Produtos sem preço não recebem oferta de preço no schema. Não foram adicionadas avaliações fictícias, garantia de disponibilidade ou palavras-chave ocultas.

## Manutenção

Ao cadastrar produto público no catálogo, o sitemap passa a incluí-lo automaticamente. Para melhorar o resultado de um item, preencha nome, marca, aplicação, materiais, descrição, imagem e compatibilidade confirmada no fluxo administrativo.

## Referências

- Google Search Central — dados estruturados de Product: https://developers.google.com/search/docs/appearance/structured-data/product
- Google Search Central — sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google Search Central — SEO para JavaScript: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google Search Central — URLs canônicas: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
