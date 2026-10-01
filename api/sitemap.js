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
      ...products.map((product) => ({
        loc: `${ORIGIN}/produto/${encodeURIComponent(slugFor(product))}`,
        changefreq: "weekly",
        priority: "0.8",
        image: product.imagem_principal,
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
