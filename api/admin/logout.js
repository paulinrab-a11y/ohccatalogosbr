import {
  clearSessionCookies,
  json,
  requireAdmin,
  revokeSession,
  secureEndpoint,
} from "../../server/adminAuth.js";
export default secureEndpoint(async (req, res) => {
  if (req.method !== "POST")
    return json(res, 405, { error: "Método não permitido." });
  try {
    const session = await requireAdmin(req, res);
    if (session) await revokeSession(session.accessToken);
  } finally {
    clearSessionCookies(req, res);
  }
  return json(res, 200, { ok: true });
});
