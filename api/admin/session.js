import {
  getAuthUser,
  json,
  readBody,
  setSessionCookies,
  verifyOtp,
  allowedAdmin,
  secureEndpoint,
} from "../../server/adminAuth.js";
import { limitRequest, problem } from "../../server/runtime.js";
export default secureEndpoint(async (req, res) => {
  if (req.method !== "POST")
    return json(res, 405, { error: "Método não permitido." });
  const body = await readBody(req, 32768);
  let session;
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  await limitRequest(req, "otp-verify", email);
  if (email && typeof body.token === "string") {
    if (
      email.length > 254 ||
      !allowedAdmin(email) ||
      !/^\d{6,8}$/.test(body.token)
    )
      throw problem("Código inválido ou expirado.", 401);
    const { response, data } = await verifyOtp(email, body.token);
    if (!response.ok) throw problem("Código inválido ou expirado.", 401);
    session = data;
  } else if (
    typeof body.access_token === "string" &&
    typeof body.refresh_token === "string" &&
    body.access_token.length <= 8192 &&
    body.refresh_token.length <= 8192
  ) {
    session = {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_in: 3600,
    };
  }
  if (!session?.access_token || !session?.refresh_token)
    throw problem("Sessão inválida.");
  const user = await getAuthUser(session.access_token);
  if (!user) throw problem("Acesso inválido ou expirado.", 401);
  setSessionCookies(req, res, session);
  return json(res, 200, { ok: true, user: { email: user.email } });
});
