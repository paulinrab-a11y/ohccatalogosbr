import { listPublicProducts } from "../server/publicCatalog.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    return res.end(JSON.stringify({ error: "Método não permitido." }));
  }
  try {
    const rows = await listPublicProducts();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.end(JSON.stringify({ products: rows }));
  } catch (error) {
    res.statusCode = Number(error?.status) || 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        error: "Catálogo dinâmico indisponível.",
        code: error?.code || undefined,
      }),
    );
  }
}
