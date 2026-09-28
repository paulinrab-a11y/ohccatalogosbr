import {
  backendUrl,
  publicKey,
  boundedFetch,
  serviceRpc,
  problem,
  requestOrigin,
  logFailure,
} from "./runtime.js";
const MAX_BODY = 4 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}
function objectBody(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw problem("Envie um objeto JSON.");
  return value;
}
export async function readBody(req, max = MAX_BODY) {
  if (Number(req.headers["content-length"]) > max)
    throw problem("Solicitação grande demais.", 413);
  if (req.body !== undefined) {
    const raw =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > max)
      throw problem("Solicitação grande demais.", 413);
    try {
      return objectBody(JSON.parse(raw));
    } catch (e) {
      if (e.status) throw e;
      throw problem("JSON inválido.");
    }
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > max) throw problem("Solicitação grande demais.", 413);
    chunks.push(bytes);
  }
  try {
    return objectBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (e) {
    if (e.status) throw e;
    throw problem("JSON inválido.");
  }
}
function cookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(
        part.slice(i + 1).trim(),
      );
    } catch {}
  }
  return out;
}
function cookie(name, value, req, ttl) {
  const secure =
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production" ||
    req.headers["x-forwarded-proto"] === "https";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttl}${secure ? "; Secure" : ""}`;
}
export function setSessionCookies(req, res, s) {
  res.setHeader("Set-Cookie", [
    cookie(
      "ohc_admin_access",
      s.access_token,
      req,
      Math.min(3600, Math.max(1, Number(s.expires_in) || 3600)),
    ),
    cookie("ohc_admin_refresh", s.refresh_token, req, 2592000),
  ]);
}
export function clearSessionCookies(req, res) {
  res.setHeader("Set-Cookie", [
    cookie("ohc_admin_access", "", req, 0),
    cookie("ohc_admin_refresh", "", req, 0),
  ]);
}
export function allowedAdmin(email) {
  const configured = String(process.env.OHC_ADMIN_EMAILS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return !configured.length || configured.includes(String(email).toLowerCase());
}
function isOhcAdmin(user) {
  return Boolean(
    user?.id &&
      user?.email &&
      allowedAdmin(user.email) &&
      user.app_metadata?.role === "ohc_admin",
  );
}
async function auth(path, init = {}) {
  const key = publicKey();
  if (!key) throw problem("Autenticação indisponível neste ambiente.", 503);
  const response = await boundedFetch(`${backendUrl()}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (response.status >= 500)
    throw problem("Autenticação temporariamente indisponível.", 503);
  return { response, data };
}
export function requestOtp(email, redirectTo) {
  return auth(`otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    body: JSON.stringify({ email, create_user: false }),
  });
}
export function verifyOtp(email, token) {
  return auth("verify", {
    method: "POST",
    body: JSON.stringify({ email, token, type: "email" }),
  });
}
export async function getAuthUser(token) {
  if (typeof token !== "string" || !token || token.length > 8192) return null;
  const { response, data } = await auth("user", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok || !isOhcAdmin(data)) return null;
  let claims;
  try {
    claims = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }
  if (
    !UUID.test(claims.session_id || "") ||
    claims.sub !== data.id ||
    !Number.isFinite(claims.exp) ||
    claims.exp * 1000 <= Date.now()
  )
    return null;
  return (await serviceRpc("ohc_audit_session_active", {
    p_session_id: claims.session_id,
    p_user_id: data.id,
  })) === true
    ? data
    : null;
}
export async function requireAdmin(req, res) {
  const c = cookies(req);
  let accessToken = c.ohc_admin_access || "",
    refreshToken = c.ohc_admin_refresh || "";
  let user = await getAuthUser(accessToken);
  if (!user && refreshToken && refreshToken.length < 8192) {
    const { response, data } = await auth("token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (response.ok && data?.access_token && data?.refresh_token) {
      user = await getAuthUser(data.access_token);
      if (user) {
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        setSessionCookies(req, res, data);
      }
    }
  }
  if (!user) {
    clearSessionCookies(req, res);
    return null;
  }
  return { user, accessToken, refreshToken };
}
export async function revokeSession(token) {
  const { response } = await auth("logout?scope=local", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok)
    throw problem("Não foi possível revogar a sessão. Tente novamente.", 503);
}
export async function callAdminEdge(token, payload) {
  const response = await boundedFetch(
    `${backendUrl()}/functions/v1/ohc-compatibility`,
    {
      method: "POST",
      headers: {
        apikey: publicKey(),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  let data = await response.json().catch(() => null);
  if (response.status >= 500)
    data = { error: "Serviço administrativo temporariamente indisponível." };
  return { response, data };
}
export function secureEndpoint(handler) {
  return async (req, res) => {
    try {
      if (req.method === "POST") {
        requestOrigin(req);
        if (req.headers["sec-fetch-site"] === "cross-site")
          throw problem("Origem não autorizada.", 403);
        if (
          !/^application\/json(?:\s*;|$)/i.test(
            String(req.headers["content-type"] || ""),
          )
        )
          throw problem("Envie JSON.", 415);
      }
      return await handler(req, res);
    } catch (e) {
      const status = [
        400, 401, 403, 404, 405, 409, 413, 415, 429, 503,
      ].includes(e.status)
        ? e.status
        : 500;
      if (e.retryAfter) res.setHeader("Retry-After", String(e.retryAfter));
      const id =
        status >= 500 ? logFailure("gateway_request_failed") : undefined;
      return json(res, status, {
        error:
          status >= 500 ? "Serviço temporariamente indisponível." : e.message,
        request_id: id,
      });
    }
  };
}
