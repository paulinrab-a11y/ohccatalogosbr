import { json, secureEndpoint } from "../server/adminAuth.js";
import { backendUrl, publicKey, problem } from "../server/runtime.js";

export default secureEndpoint(async (req, res) => {
  // Temporary Preview-only diagnostics: never log environment values.
  if (process.env.VERCEL_ENV === "preview") {
    const url = process.env.OHC_CUSTOMER_SUPABASE_URL || "";
    const key = process.env.OHC_CUSTOMER_PUBLISHABLE_KEY || "";
    let hostValid = false,
      pathValid = false,
      protocolValid = false;
    try {
      const parsed = new URL(url);
      hostValid = /^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname);
      pathValid =
        parsed.pathname === "/" &&
        !parsed.search &&
        !parsed.hash &&
        !parsed.username &&
        !parsed.password;
      protocolValid = parsed.protocol === "https:";
    } catch {}
    let anon = false;
    try {
      anon =
        JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
          .role === "anon";
    } catch {}
    console.info(
      "customer_config_preflight",
      JSON.stringify({
        urlPresent: !!url,
        keyPresent: !!key,
        urlWhitespace: url !== url.trim(),
        keyWhitespace: key !== key.trim(),
        hostValid,
        pathValid,
        protocolValid,
        sameBackend:
          url ===
          (process.env.SUPABASE_URL ||
            "https://wlxknhgaoopycrlxygsd.supabase.co"),
        publishableFormat: /^sb_publishable_[A-Za-z0-9_-]+$/.test(key),
        publishableAfterTrim: /^sb_publishable_[A-Za-z0-9_-]+$/.test(
          key.trim(),
        ),
        anon,
      }),
    );
  }

  if (req.method !== "GET")
    return json(res, 405, { error: "Método não permitido." });
  // Preview must explicitly select a non-production Auth project.
  const url = process.env.OHC_CUSTOMER_SUPABASE_URL || backendUrl();
  const key = process.env.OHC_CUSTOMER_PUBLISHABLE_KEY || publicKey();
  if (
    process.env.VERCEL_ENV === "preview" &&
    (!process.env.OHC_CUSTOMER_SUPABASE_URL || url === backendUrl())
  )
    throw problem("Área de conta indisponível neste ambiente.", 503);
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw problem("Autenticação indisponível.", 503);
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
    throw problem("Autenticação indisponível.", 503);
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
  if (!publicOnly) throw problem("Autenticação indisponível.", 503);
  return json(res, 200, { url: parsed.origin, publishableKey: key });
});
