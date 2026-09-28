import { secureEndpoint } from "../../server/adminAuth.js";
import { json, requireAdmin } from "../../server/adminAuth.js";

async function handler(req, res) {
  if (req.method !== "GET")
    return json(res, 405, { error: "Método não permitido." });
  const session = await requireAdmin(req, res);
  if (!session)
    return json(res, 401, {
      error: "Sessão administrativa inválida ou expirada.",
    });
  return json(res, 200, {
    user: {
      email: session.user.email,
      role: session.user.app_metadata?.role || null,
    },
  });
}

export default secureEndpoint(handler);
