# SEO do catálogo OHC Motors

Atualizado em 01/10/2026. A implementação prioriza páginas de produto rastreáveis, conteúdo real do catálogo e dados estruturados sem inventar compatibilidade, preço, avaliações ou disponibilidade.

## O que foi aplicado

- URL canônica por produto em `/produto/<slug>`.
- Título e descrição únicos por produto, usando nome, marca, aplicação, acabamento, observações e compatibilidades confirmadas.
- Texto visível “Sobre este produto” na página individual.
- JSON-LD `Product` e `BreadcrumbList` nos produtos.
- JSON-LD `Organization` e `WebSite` na página inicial.
- Metadados `description`, canonical, Open Graph, Twitter Card e `robots`.
- Sitemap XML dinâmico em `/sitemap.xml`, alimentado pelos produtos públicos ativos do catálogo.
- `robots.txt` permitindo o catálogo e bloqueando áreas privadas.
- Rotas amigáveis preservam as URLs antigas com SKU para não quebrar links existentes.

## Regras de conteúdo

O site só publica como fato o que existe nos dados do produto. Quando a compatibilidade não está confirmada, o texto orienta o cliente a consultar a OHC. Produtos sem preço não recebem oferta de preço no schema. Não foram adicionadas avaliações fictícias, garantia de disponibilidade ou palavras-chave ocultas.

## Manutenção

Ao cadastrar produto público no catálogo, o sitemap passa a incluí-lo automaticamente. Para melhorar o resultado de um item, preencha nome, marca, aplicação, materiais, descrição, imagem e compatibilidade confirmada no fluxo administrativo.

## Referências

- Google Search Central — dados estruturados de Product: https://developers.google.com/search/docs/appearance/structured-data/product
- Google Search Central — sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google Search Central — SEO para JavaScript: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Google Search Central — URLs canônicas: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
