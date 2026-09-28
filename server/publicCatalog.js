const URL =
  process.env.SUPABASE_URL || "https://wlxknhgaoopycrlxygsd.supabase.co";
const KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const COLUMNS =
  "sku,slug,categoria,tipo_produto,marca,nome_produto,material,recursos,descricao,imagem_principal,outras_imagens,geracao_chassi,ano_inicio,ano_fim,shift_light,compatibilidade,ativo";

export async function listPublicProducts() {
  if (!KEY) throw new Error("Catálogo indisponível.");
  const response = await fetch(
    `${URL}/rest/v1/catalog_products?select=${COLUMNS}&ativo=is.true&order=marca.asc,nome_produto.asc&limit=1000`,
    {
      headers: { apikey: KEY },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw new Error("Catálogo dinâmico indisponível.");
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Resposta inválida do catálogo.");
  // product_prices.active authorizes WhatsApp automation, not website publication.
  return rows
    .filter((row) => row.ativo === true)
    .map((row) => ({
      ...Object.fromEntries(COLUMNS.split(",").map((key) => [key, row[key]])),
      price: null,
    }));
}
