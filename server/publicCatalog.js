const URL =
  process.env.SUPABASE_URL || "https://wlxknhgaoopycrlxygsd.supabase.co";
const KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const COLUMNS =
  "sku,slug,categoria,tipo_produto,marca,nome_produto,material,recursos,descricao,imagem_principal,outras_imagens,geracao_chassi,ano_inicio,ano_fim,shift_light,compatibilidade,ativo";
// Only the price columns the public role may read (migration 20261013150000).
// product_prices.active authorizes WhatsApp automation; published_on_site is
// the separate decision to show the price here, and RLS returns only those rows.
const PRICE_COLUMNS =
  "sku,price,card_price,promotional_price,promotional_price_starts_at,promotional_price_ends_at";

async function get(path) {
  const response = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Catálogo dinâmico indisponível.");
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Resposta inválida do catálogo.");
  return rows;
}

async function listPublishedPrices() {
  try {
    return await get(
      `product_prices?select=${PRICE_COLUMNS}&active=is.true&published_on_site=is.true&limit=1000`,
    );
  } catch {
    // Prices are optional: without them every product shows "Consulte no
    // WhatsApp" instead of the whole catalog failing.
    return [];
  }
}

/* Outside production (Vercel previews, local dev), and only while no real price
   is published, products carry clearly flagged demonstration prices so the
   price layout and the promotion flow can be reviewed. Production never does. */
const DEMO = {
  Volantes: [3490, 3890],
  Grades: [1500, 1690],
  "Faróis & Lanternas": [2190, 2450],
  Acessórios: [890, 990],
};

export function demoPrices(rows, now = new Date()) {
  const end = new Date(now.getTime() + 10 * 86400000).toISOString();
  let promos = 0;
  return rows.map((row) => {
    const [price, card] = DEMO[row.categoria] || DEMO.Acessórios;
    // A few wheels run a demo promotion so /promocoes and the badges show.
    const promo = row.categoria === "Volantes" && promos < 3;
    if (promo) promos++;
    return {
      ...row,
      price,
      card_price: card,
      promotional_price: promo ? Math.round(price * 0.9) : null,
      promotional_price_starts_at: null,
      promotional_price_ends_at: promo ? end : null,
      price_demo: true,
    };
  });
}

export function withPrices(rows, prices) {
  const bySku = new Map(prices.map((p) => [p.sku, p]));
  const num = (v) => (v != null && Number(v) > 0 ? Number(v) : null);
  return rows.map((row) => {
    const p = bySku.get(row.sku);
    return {
      ...row,
      price: num(p?.price),
      card_price: num(p?.card_price),
      promotional_price: num(p?.promotional_price),
      promotional_price_starts_at: p?.promotional_price_starts_at || null,
      promotional_price_ends_at: p?.promotional_price_ends_at || null,
    };
  });
}

export async function listPublicProducts() {
  if (!KEY) throw new Error("Catálogo indisponível.");
  const [raw, prices] = await Promise.all([
    get(
      `catalog_products?select=${COLUMNS}&ativo=is.true&order=marca.asc,nome_produto.asc&limit=1000`,
    ),
    listPublishedPrices(),
  ]);
  const rows = raw
    .filter((row) => row.ativo === true)
    .map((row) =>
      Object.fromEntries(COLUMNS.split(",").map((key) => [key, row[key]])),
    );
  const production = process.env.VERCEL_ENV === "production";
  if (!production && !prices.length) return demoPrices(rows);
  return withPrices(rows, prices);
}
