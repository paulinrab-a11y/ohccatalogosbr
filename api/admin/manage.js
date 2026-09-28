import { secureEndpoint } from "../../server/adminAuth.js";
import { json, readBody, requireAdmin } from "../../server/adminAuth.js";
import {
  listProductsAdmin,
  saveProductAdmin,
  toggleProductAdmin,
  listMediaAdmin,
  uploadMediaAdmin,
  deleteMediaAdmin,
  listAdminsAdmin,
  setAdminRoleAdmin,
  listRulesAdmin,
  listAuditAdmin,
  settingsInfoAdmin,
} from "../../server/adminData.js";

const ACTIONS = new Set([
  "products_list",
  "product_save",
  "product_toggle",
  "media_list",
  "media_upload",
  "media_delete",
  "admins_list",
  "admin_set_role",
  "rules_list",
  "audit_list",
  "settings_info",
]);

async function handler(req, res) {
  if (req.method !== "POST")
    return json(res, 405, { error: "Método não permitido." });
  const session = await requireAdmin(req, res);
  if (!session)
    return json(res, 401, {
      error: "Sessão administrativa inválida ou expirada.",
    });

  try {
    const body = await readBody(req);
    const action = String(body.action || "");
    if (!ACTIONS.has(action))
      return json(res, 400, { error: "Ação de gestão inválida." });

    if (action === "products_list")
      return json(res, 200, { products: await listProductsAdmin() });
    if (action === "product_save")
      return json(res, 200, {
        product: await saveProductAdmin(body.product || {}, session.user.email),
      });
    if (action === "product_toggle")
      return json(res, 200, {
        product: await toggleProductAdmin(body.id, body.active),
      });
    if (action === "media_list")
      return json(res, 200, { media: await listMediaAdmin() });
    if (action === "media_upload")
      return json(res, 201, { asset: await uploadMediaAdmin(body) });
    if (action === "media_delete")
      return json(res, 200, await deleteMediaAdmin(body.path));
    if (action === "admins_list")
      return json(res, 200, { admins: await listAdminsAdmin() });
    if (action === "rules_list")
      return json(res, 200, { rules: await listRulesAdmin() });
    if (action === "admin_set_role")
      return json(res, 200, {
        admin: await setAdminRoleAdmin(
          body.email,
          body.make_admin,
          session.accessToken,
        ),
      });
    if (action === "audit_list")
      return json(res, 200, { events: await listAuditAdmin(body.limit) });
    if (action === "settings_info")
      return json(res, 200, { settings: await settingsInfoAdmin() });

    return json(res, 400, { error: "Ação não suportada." });
  } catch (error) {
    console.error("OHC admin management failure", {
      status: Number(error?.status) || 500,
      code: error?.code || "management_failed",
    });
    return json(res, Number(error?.status) || 500, {
      error:
        Number(error?.status) < 500
          ? error.message
          : "Não foi possível concluir a ação administrativa. Verifique a configuração do servidor.",
      code: error?.code || undefined,
    });
  }
}

export default secureEndpoint(handler);
