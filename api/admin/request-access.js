import {
  allowedAdmin,
  json,
  readBody,
  requestOtp,
  secureEndpoint,
} from "../../server/adminAuth.js";
import { limitRequest, requestOrigin, problem } from "../../server/runtime.js";
export default secureEndpoint(async (req, res) => {
  if (req.method !== "POST")
    return json(res, 405, { error: "Método não permitido." });
  const body = await readBody(req, 16384);
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    throw problem("Informe um e-mail válido.");
  await limitRequest(req, "otp-send", email);
  if (allowedAdmin(email))
    await requestOtp(email, `${requestOrigin(req)}/admin/login`);
  // Same response for unknown, non-allowlisted and registered accounts.
  return json(res, 200, { ok: true });
});
