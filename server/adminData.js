import { sanitizeImage } from "./images.js";
import { randomUUID } from "node:crypto";
import { backendUrl, publicKey, boundedFetch, problem } from "./runtime.js";
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://wlxknhgaoopycrlxygsd.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SITE_ASSETS_BUCKET = "site-assets";

function adminDataConfigured() {
  return Boolean(SERVICE_KEY);
}

function requireServiceKey() {
  if (!SERVICE_KEY) {
    const error = new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente do servidor.",
    );
    error.code = "service_role_missing";
    error.status = 503;
    throw error;
  }
}

async function request(path, init = {}) {
  requireServiceKey();
  const response = await boundedFetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const error = problem(
      "Não foi possível concluir a operação no serviço.",
      response.status === 409 ? 409 : 503,
    );
    throw error;
  }
  return data;
}

function rest(path, init = {}) {
  return request(`/rest/v1/${path}`, init);
}

function cleanText(value, max = 4000) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length > max)
    throw problem("Texto inválido ou longo demais.");
  const text = value.trim();
  return text || null;
}

function cleanBoolean(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") throw problem("Valor booleano inválido.");
  return value;
}

function cleanInteger(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (
    !["number", "string"].includes(typeof value) ||
    !Number.isSafeInteger(number) ||
    number <= 0
  )
    throw problem("Identificador ou ano inválido.");
  return number;
}

function normalizeProductInput(input = {}) {
  return {
    sku: cleanText(input.sku, 120),
    slug: cleanText(input.slug, 180),
    categoria: cleanText(input.categoria, 120),
    tipo_produto: cleanText(input.tipo_produto, 120),
    marca: cleanText(input.marca, 120),
    nome_produto: cleanText(input.nome_produto, 260),
    material: cleanText(input.material, 500),
    cor: cleanText(input.cor, 240),
    recursos: cleanText(input.recursos, 2500),
    descricao: cleanText(input.descricao, 5000),
    sku_aliases: cleanText(input.sku_aliases, 1200),
    imagem_principal: cleanText(input.imagem_principal, 1200),
    outras_imagens: cleanText(input.outras_imagens, 5000),
    geracao_chassi: cleanText(input.geracao_chassi, 1200),
    ano_inicio: cleanInteger(input.ano_inicio),
    ano_fim: cleanInteger(input.ano_fim),
    tipo_cubo_adaptador: cleanText(input.tipo_cubo_adaptador, 800),
    observacoes_airbag_comandos: cleanText(
      input.observacoes_airbag_comandos,
      2500,
    ),
    formato_aro: cleanText(input.formato_aro, 500),
    paddle_shift: cleanBoolean(input.paddle_shift),
    comandos_multifuncionais: cleanBoolean(input.comandos_multifuncionais),
    shift_light: cleanText(input.shift_light, 500),
    compatibilidade: cleanText(input.compatibilidade, 5000),
    ativo: cleanBoolean(input.ativo, true),
    updated_at: new Date().toISOString(),
  };
}

function normalizePrice(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function listProductsAdmin() {
  const [products, prices] = await Promise.all([
    rest(
      "catalog_products?select=*&order=marca.asc,nome_produto.asc&limit=1000",
    ),
    rest("product_prices?select=*&order=sku.asc&limit=1000").catch(() => []),
  ]);
  const priceMap = new Map((prices || []).map((row) => [row.sku, row]));
  return (products || []).map((product) => ({
    ...product,
    price_record: priceMap.get(product.sku) || null,
  }));
}

export async function saveProductAdmin(input, actor) {
  const product = normalizeProductInput(input);
  if (!product.sku || !product.nome_produto) {
    const error = new Error("SKU e nome do produto são obrigatórios.");
    error.status = 400;
    throw error;
  }
  if (
    product.ano_inicio &&
    product.ano_fim &&
    product.ano_inicio > product.ano_fim
  ) {
    const error = new Error("A faixa de anos do produto é inválida.");
    error.status = 400;
    throw error;
  }

  const id = cleanInteger(input.id);
  let saved;
  if (id) {
    // Preserve fields absent from the editor instead of replacing them with null.
    for (const key of Object.keys(product)) {
      if (key !== "updated_at" && !Object.hasOwn(input, key))
        delete product[key];
    }
    const existing = await rest(`catalog_products?id=eq.${id}&select=sku`);
    if (existing?.[0] && existing[0].sku !== product.sku)
      throw Object.assign(
        new Error("O SKU de um produto existente não pode ser alterado."),
        { status: 400 },
      );
    saved = await rest(`catalog_products?id=eq.${id}&select=*`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(product),
    });
    if (!Array.isArray(saved) || !saved.length) {
      const error = new Error("Produto não encontrado para edição.");
      error.status = 404;
      throw error;
    }
  } else {
    // A tabela atual usa bigint sem sequence/default. Calculamos o próximo ID e
    // repetimos em caso de colisão para evitar falha quando dois admins salvam juntos.
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await rest(
        "catalog_products?select=id&order=id.desc&limit=1",
      );
      const nextId = Math.max(1, Number(latest?.[0]?.id || 0) + 1);
      try {
        saved = await rest("catalog_products?select=*", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ id: nextId, ...product }),
        });
        break;
      } catch (error) {
        lastError = error;
        if (Number(error?.status) !== 409) throw error;
      }
    }
    if (!saved)
      throw (
        lastError ||
        new Error("Não foi possível reservar um ID para o produto.")
      );
  }

  const price = normalizePrice(input.price);
  const promo = normalizePrice(input.promotional_price);
  if (price) {
    await rest("product_prices?on_conflict=sku", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        sku: product.sku,
        price,
        promotional_price: promo,
        price_currency: "BRL",
        active: cleanBoolean(input.price_active, false),
        source_document:
          cleanText(input.source_document, 500) || "Painel administrativo OHC",
        confirmed_at: new Date().toISOString(),
        confirmed_by: actor || null,
        updated_at: new Date().toISOString(),
      }),
    });
  }
  return saved?.[0] || null;
}

export async function toggleProductAdmin(id, active) {
  if (typeof active !== "boolean")
    throw Object.assign(new Error("Estado inválido."), { status: 400 });
  const numericId = cleanInteger(id);
  if (!numericId) {
    const error = new Error("Produto inválido.");
    error.status = 400;
    throw error;
  }
  const rows = await rest(`catalog_products?id=eq.${numericId}&select=*`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      ativo: Boolean(active),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!rows?.length) {
    const error = new Error("Produto não encontrado.");
    error.status = 404;
    throw error;
  }
  return rows[0];
}

export async function listMediaAdmin() {
  const listPrefix = async (prefix) => {
    const files = await request(
      `/storage/v1/object/list/${SITE_ASSETS_BUCKET}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix,
          limit: 1000,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        }),
      },
    );
    return (files || [])
      .filter((item) => item?.name && item.id)
      .map((item) => {
        const path = prefix
          ? `${prefix.replace(/\/$/, "")}/${item.name}`
          : item.name;
        return {
          ...item,
          path,
          public_url: `${SUPABASE_URL}/storage/v1/object/public/${SITE_ASSETS_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`,
        };
      });
  };
  const [rootFiles, adminFiles] = await Promise.all([
    listPrefix(""),
    listPrefix("admin"),
  ]);
  const seen = new Set();
  return [...adminFiles, ...rootFiles].filter(
    (item) => !seen.has(item.path) && seen.add(item.path),
  );
}

function safeObjectName(input, extension) {
  const base =
    String(input || "asset")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "asset";
  const withoutExt = base.replace(/\.(webp|svg)$/i, "");
  return `admin/${randomUUID()}-${withoutExt}.${extension}`;
}

export async function uploadMediaAdmin(input) {
  const contentType = String(input.content_type || "").toLowerCase();
  const extension = contentType === "image/webp" ? "webp" : "";
  if (!extension) {
    const error = new Error(
      "Envie uma imagem WebP. SVGs existentes continuam disponíveis para leitura.",
    );
    error.status = 400;
    throw error;
  }
  const bytes = await sanitizeImage(input, { webpOnly: true });
  const path = safeObjectName(input.name, extension);
  await request(
    `/storage/v1/object/${SITE_ASSETS_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`,
    {
      method: "POST",
      headers: { "Content-Type": contentType, "x-upsert": "false" },
      body: bytes,
    },
  );
  return {
    path,
    public_url: `${SUPABASE_URL}/storage/v1/object/public/${SITE_ASSETS_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`,
  };
}

export async function deleteMediaAdmin(path) {
  const value = cleanText(path, 600);
  if (
    !value ||
    !/^admin\/[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(value) ||
    value.includes("..")
  ) {
    const error = new Error(
      "Por segurança, somente arquivos enviados pelo painel podem ser excluídos por aqui.",
    );
    error.status = 400;
    throw error;
  }
  await request(
    `/storage/v1/object/${SITE_ASSETS_BUCKET}/${value.split("/").map(encodeURIComponent).join("/")}`,
    { method: "DELETE" },
  );
  return { deleted: true, path: value };
}

async function listAuthUsers() {
  const data = await request("/auth/v1/admin/users?page=1&per_page=1000");
  return Array.isArray(data) ? data : data?.users || [];
}

export async function listAdminsAdmin() {
  const users = await listAuthUsers();
  return users
    .filter((user) => user?.app_metadata?.role === "ohc_admin")
    .map((user) => ({
      id: user.id,
      email: user.email,
      role: user.app_metadata?.role,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      created_at: user.created_at,
    }))
    .sort((a, b) => String(a.email).localeCompare(String(b.email)));
}

export async function setAdminRoleAdmin(email, makeAdmin, accessToken) {
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof makeAdmin !== "boolean"
  )
    throw problem("Dados inválidos.");
  const response = await boundedFetch(
    `${backendUrl()}/rest/v1/rpc/ohc_audit_change_admin_role`,
    {
      method: "POST",
      headers: {
        apikey: publicKey(),
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_email: email.trim().toLowerCase(),
        p_make_admin: makeAdmin,
      }),
    },
  );
  if (!response.ok)
    throw problem("Gestão de acesso temporariamente indisponível.", 503);
  const data = await response.json();
  if (data?.ok !== true) {
    const errors = {
      not_authorized: ["Sessão inválida ou sem permissão.", 403],
      user_not_found: [
        "Usuário não encontrado. Crie ou convide a conta antes de conceder acesso.",
        404,
      ],
      cannot_remove_self: ["Você não pode remover o próprio acesso.", 400],
      last_admin: ["Não é permitido remover o último administrador.", 409],
    };
    const [message, status] = errors[data?.error] || [
      "Não foi possível alterar o acesso.",
      503,
    ];
    throw problem(message, status);
  }
  return data.admin;
}

export async function listRulesAdmin() {
  return await rest(
    "compatibility_rules?select=id,product_id,product_sku,vehicle_brand,vehicle_model,generation_chassis,vehicle_version,year_from,year_to,status,active,rule_scope,scope_explicitly_approved,public_notes,internal_notes,installation_conditions,confidence_level,confirmed_by,confirmed_at,rule_version,evidence_request_id,updated_at&order=updated_at.desc&limit=2000",
  );
}

export async function listAuditAdmin(limit = 200) {
  const safeLimit = Math.min(500, Math.max(1, cleanInteger(limit) || 200));
  return await rest(
    `compatibility_rule_audit?select=id,rule_id,request_id,decision_batch_id,action,previous_status,new_status,actor,change_reason,previous_rule_version,new_rule_version,details,created_at&order=created_at.desc&limit=${safeLimit}`,
  );
}

export async function settingsInfoAdmin() {
  const [products, admins, rules] = await Promise.all([
    rest("catalog_products?select=id,ativo,imagem_principal&limit=1000"),
    listAdminsAdmin(),
    rest("compatibility_rules?select=id,active&limit=5000"),
  ]);
  return {
    backend_management_configured: adminDataConfigured(),
    supabase_url: SUPABASE_URL,
    assets_bucket: SITE_ASSETS_BUCKET,
    configured_email_allowlist: String(process.env.OHC_ADMIN_EMAILS || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    counts: {
      products: products.length,
      active_products: products.filter((p) => p.ativo).length,
      inactive_products: products.filter((p) => !p.ativo).length,
      products_without_image: products.filter((p) => !p.imagem_principal)
        .length,
      admins: admins.length,
      active_rules: rules.filter((rule) => rule.active).length,
    },
  };
}
