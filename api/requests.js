import { publicInput } from "../server/publicInput.js";
import { sanitizeImage } from "../server/images.js";
import { problem } from "../server/runtime.js";
import { readBody, secureEndpoint } from "../server/adminAuth.js";
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://wlxknhgaoopycrlxygsd.supabase.co";
const ANON_JWT = process.env.SUPABASE_ANON_KEY || "";
const API_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || ANON_JWT;
const INTERNAL_TOKEN = process.env.OHC_EDGE_TOKEN || "";
import { limitRequest, boundedFetch } from "../server/runtime.js";

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}

async function handler(req, res) {
  if (req.method !== "POST")
    return send(res, 405, { error: "Método não permitido." });
  if (!ANON_JWT || !API_KEY || !INTERNAL_TOKEN) {
    return send(res, 503, {
      error:
        "A integração de compatibilidade ainda não está configurada neste ambiente.",
    });
  }
  try {
    await limitRequest(req, "public-submit");
    const body = await readBody(req);
    if (
      body.files !== undefined &&
      (!Array.isArray(body.files) || body.files.length > 3)
    )
      throw problem("Envie no máximo três imagens.");
    const input = publicInput(body);
    const files = [];
    for (const file of body.files || []) {
      const bytes = await sanitizeImage(file);
      files.push({
        name: "foto.webp",
        content_type: "image/webp",
        size: bytes.length,
        data: bytes.toString("base64"),
      });
    }
    const response = await boundedFetch(
      `${SUPABASE_URL}/functions/v1/ohc-compatibility`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: API_KEY,
          Authorization: `Bearer ${ANON_JWT}`,
          "x-ohc-internal-token": INTERNAL_TOKEN,
        },
        body: JSON.stringify({ ...input, files, action: "submit" }),
      },
    );
    const data = await response.json().catch(() => ({
      error: "Resposta inválida do serviço de compatibilidade.",
    }));
    if (response.headers.get("retry-after"))
      res.setHeader("Retry-After", response.headers.get("retry-after"));
    return send(
      res,
      response.status,
      response.status >= 500
        ? { error: "Não foi possível registrar a consulta." }
        : data,
    );
  } catch (error) {
    if (error?.retryAfter)
      res.setHeader("Retry-After", String(error.retryAfter));
    return send(res, Number(error?.status) || 500, {
      error:
        Number(error?.status) < 500
          ? error.message
          : "Não foi possível registrar a consulta.",
    });
  }
}

export default secureEndpoint(handler);
