import { listPublicProducts } from "../server/publicCatalog.js";

const ORIGIN = "https://www.ohcmotorsbr.com.br";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

// Stored photos are site paths (/img/p/...) or full URLs; sitemaps need full URLs.
export function absoluteUrl(src) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  return src.startsWith("/") ? `${ORIGIN}${src}` : null;
}

// Brand and category pages have their own canonical (src/lib/seo.ts). Only the
// categories the site recognizes (CATS in src/lib/products.ts) get one.
const CATS = ["Volantes", "Grades", "Faróis & Lanternas", "Acessórios"];

export function catalogUrls(products) {
  const unique = (key) =>
    [...new Set(products.map((p) => p[key]).filter(Boolean))].sort();
  return [
    ...unique("categoria")
      .filter((c) => CATS.includes(c))
      .map((c) => ["categoria", c]),
    ...unique("marca").map((m) => ["marca", m]),
  ].map(([key, value]) => ({
    loc: `${ORIGIN}/catalogo?${new URLSearchParams({ [key]: value })}`,
    changefreq: "weekly",
    priority: "0.7",
  }));
}

function slugFor(row) {
  return (
    row.slug ||
    String(row.sku || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    return res.end("Method Not Allowed");
  }
  try {
    const products = await listPublicProducts();
    const urls = [
      { loc: `${ORIGIN}/`, changefreq: "weekly", priority: "1.0" },
      { loc: `${ORIGIN}/catalogo`, changefreq: "daily", priority: "0.9" },
      {
        loc: `${ORIGIN}/compatibilidade`,
        changefreq: "weekly",
        priority: "0.8",
      },
      { loc: `${ORIGIN}/sobre`, changefreq: "monthly", priority: "0.6" },
      ...catalogUrls(products),
      // The site only opens products that have a SKU (src/lib/products.ts).
      ...products
        .filter((product) => product.sku)
        .map((product) => ({
          loc: `${ORIGIN}/produto/${encodeURIComponent(slugFor(product))}`,
          changefreq: "weekly",
          priority: "0.8",
          image: absoluteUrl(product.imagem_principal),
        })),
    ];
    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
      ...urls.map((url) =>
        [
          "  <url>",
          `    <loc>${escapeXml(url.loc)}</loc>`,
          `    <changefreq>${url.changefreq}</changefreq>`,
          `    <priority>${url.priority}</priority>`,
          url.image && /^https?:\/\//i.test(url.image)
            ? `    <image:image><image:loc>${escapeXml(url.image)}</image:loc></image:image>`
            : "",
          "  </url>",
        ]
          .filter(Boolean)
          .join("\n"),
      ),
      "</urlset>",
      "",
    ].join("\n");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    res.end(body);
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    );
  }
}
