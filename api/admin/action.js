import { secureEndpoint } from "../../server/adminAuth.js";
import {
  callAdminEdge,
  json,
  readBody,
  requireAdmin,
} from "../../server/adminAuth.js";

const ALLOWED_ACTIONS = new Set([
  "admin_dashboard",
  "admin_detail",
  "save_decision_v2",
  "deactivate_rule",
  "products",
  "cleanup",
]);

async function handler(req, res) {
  if (req.method !== "POST")
    return json(res, 405, { error: "Método não permitido." });
  const session = await requireAdmin(req, res);
  if (!session)
    return json(res, 401, {
      error: "Sessão administrativa inválida ou expirada.",
    });
  const body = await readBody(req);
  const action = String(body.action || "");
  if (!ALLOWED_ACTIONS.has(action))
    return json(res, 400, { error: "Ação administrativa inválida." });
  const { response, data } = await callAdminEdge(session.accessToken, body);
  return json(
    res,
    response.status,
    data || { error: "Sem resposta do serviço administrativo." },
  );
}

export default secureEndpoint(handler);
