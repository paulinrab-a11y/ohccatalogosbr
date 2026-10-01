import { json, secureEndpoint } from "../server/adminAuth.js";
import { backendUrl, publicKey } from "../server/runtime.js";

export default secureEndpoint(async (req, res) => {
  if (req.method !== "GET")
    return json(res, 405, { error: "Método não permitido." });
  const unavailable = (code) =>
    json(res, 503, {
      error: "Área de conta indisponível neste ambiente.",
      code,
    });
  const preview = process.env.VERCEL_ENV === "preview";
  const selectedUrl = (process.env.OHC_CUSTOMER_SUPABASE_URL || "").trim();
  const selectedKey = (process.env.OHC_CUSTOMER_PUBLISHABLE_KEY || "").trim();
  // Preview must explicitly select both values from a non-production Auth project.
  if (preview && !selectedUrl) return unavailable("customer_url_missing");
  if (preview && !selectedKey) return unavailable("customer_key_missing");
  const url = selectedUrl || backendUrl().trim();
  const key = selectedKey || publicKey().trim();
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return unavailable("customer_url_invalid");
  }
  if (
    parsed.protocol !== "https:" ||
    !/^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname) ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  )
    return unavailable("customer_url_invalid");
  if (preview) {
    const productionOrigins = new Set([
      "https://wlxknhgaoopycrlxygsd.supabase.co",
    ]);
    try {
      productionOrigins.add(new URL(backendUrl().trim()).origin);
    } catch {}
    if (productionOrigins.has(parsed.origin))
      return unavailable("customer_preview_project_required");
  }
  let publicOnly = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!publicOnly) {
    try {
      publicOnly =
        JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
          .role === "anon";
    } catch {
      /* fail closed */
    }
  }
  if (!publicOnly) return unavailable("customer_key_invalid");
  return json(res, 200, { url: parsed.origin, publishableKey: key });
});
