# Nove volantes pendentes de nome

Ref #6. Imagens e códigos recebidos em 29/09/2026. Os nomes serão fornecidos pelo usuário.

## Situação

Este lote é um rascunho de cadastro, fora de `public/` e sem importação pelo frontend. Não aparece na vitrine, na API pública ou no banco de produção. Nenhum produto existente foi alterado.

A consulta somente leitura em `catalog_products` não encontrou os nove SKUs em 29/09/2026. Repetir a consulta antes da futura importação para evitar conflitos com alterações posteriores.

O cadastro administrativo exige nome. Não substituir a pendência por uma marca ou modelo inferido da imagem. Marca, materiais, recursos, preço e compatibilidade também continuam sem confirmação.

| SKU | Nome | Foto original |
| --- | --- | --- |
| 1.01.L01.00022 | Pendente | [Imagem](images/1.01.L01.00022.png) |
| 1.01.L09.00001 | Pendente | [Imagem](images/1.01.L09.00001.png) |
| 1.01.L09.00004 | Pendente | [Imagem](images/1.01.L09.00004.png) |
| 1.01.M04.00003 | Pendente | [Imagem](images/1.01.M04.00003.png) |
| 1.02.L01.00004 | Pendente | [Imagem](images/1.02.L01.00004.png) |
| 1.02.L01.00011 | Pendente | [Imagem](images/1.02.L01.00011.png) |
| 1.12.F01.00009 | Pendente | [Imagem](images/1.12.F01.00009.png) |
| 3.02.M05.00009 | Pendente | [Imagem](images/3.02.M05.00009.png) |
| 1.01.L09.00006 | Pendente | [Imagem](images/1.01.L09.00006.png) |

## Preservação das imagens

Os nove PNGs de 1254 × 1254 foram copiados sem alteração dos pixels ou dos bytes. O SHA-256 em `products.json` permite verificar cada arquivo. O prefixo `SKU ` do nome de um anexo foi retirado apenas no caminho de destino; o nome recebido permanece no manifesto.

## Como concluir depois dos nomes

1. Preencher `nome_produto` pelo SKU, com o texto fornecido pelo usuário. Não deduzir especificações.
2. Conferir novamente duplicatas, preencher apenas campos confirmados e preparar imagens para a publicação aprovada.
3. Validar o schema vigente antes de importar: os campos de controle deste manifesto não são promessa de colunas existentes no banco.
4. Manter `ativo=false` durante a preparação. A API pública atual filtra por `ativo=true`; apenas `publicado=false` não seria suficiente para ocultar um produto inserido no banco.
5. Publicar somente após a revisão do cadastro e a autorização de publicação. Nenhuma alteração de produção faz parte deste PR.

Validação: `node scripts/validate-product-drafts.mjs`.
