import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";
export const backendUrl = () =>
  process.env.SUPABASE_URL || "https://wlxknhgaoopycrlxygsd.supabase.co";
export const publicKey = () =>
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
export function problem(message, status = 400) {
  return Object.assign(new Error(message), { status });
}
export async function boundedFetch(url, init = {}) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
}
export async function serviceRpc(name, body) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw problem("Serviço indisponível neste ambiente.", 503);
  const result = await boundedFetch(`${backendUrl()}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!result.ok) throw problem("Serviço indisponível neste momento.", 503);
  return result.json();
}
export function logFailure(event) {
  const id = randomUUID();
  console.error(JSON.stringify({ level: "error", event, request_id: id }));
  return id;
}
function origins() {
  const values = [
    process.env.OHC_PUBLIC_ORIGIN || "https://www.ohcmotorsbr.com.br",
    "https://ohcmotorsbr.com.br",
    ...(process.env.OHC_ALLOWED_ORIGINS || "").split(","),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ];
  return values
    .filter(Boolean)
    .map((v) => {
      try {
        return new URL(v.trim()).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}
export function requestOrigin(req) {
  const raw = req.headers.origin;
  try {
    const url = new URL(String(raw));
    if (url.origin !== raw) throw Error();
    if (origins().includes(url.origin)) return url.origin;
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.VERCEL !== "1" &&
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      url.host === req.headers.host
    )
      return url.origin;
  } catch {}
  throw problem("Origem não autorizada.", 403);
}
export async function limitRequest(req, scope, account = "") {
  const secret = process.env.OHC_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw problem("Proteção de acesso indisponível neste ambiente.", 503);
  // Only trust the platform-overwritten header on Vercel; elsewhere use the socket peer.
  const address =
    process.env.VERCEL === "1"
      ? String(
          req.headers["x-vercel-forwarded-for"] ||
            req.headers["x-forwarded-for"] ||
            "",
        )
          .split(",")[0]
          .trim()
      : req.socket?.remoteAddress;
  if (!isIP(address || ""))
    throw problem("Não foi possível validar a origem da solicitação.", 503);
  const hash = (v) => createHmac("sha256", secret).update(v).digest("hex");
  const result = await serviceRpc("ohc_audit_consume_limit", {
    p_scope: scope,
    p_origin: hash(address),
    p_account: account ? hash(`${address}|${account.toLowerCase()}`) : null,
  });
  if (result?.allowed !== true) {
    const e = problem("Muitas tentativas. Aguarde e tente novamente.", 429);
    e.retryAfter = Math.min(
      900,
      Math.max(1, Number(result?.retry_after) || 60),
    );
    throw e;
  }
}
