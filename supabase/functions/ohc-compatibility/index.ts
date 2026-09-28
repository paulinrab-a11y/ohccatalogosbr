import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const INTERNAL_TOKEN = Deno.env.get("OHC_EDGE_TOKEN") ?? "";
const BUCKET = "compatibility-requests";
const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff",
};

type AdminUser = { id?: string; email?: string; app_metadata?: { role?: string } };
type ProductRecommendation = {
  product_id?: number;
  sku: string;
  brand?: string | null;
  name?: string | null;
  slug?: string | null;
  image?: string | null;
  rule_id?: string;
  status?: "compativel" | "incompativel" | "compativel_com_condicoes";
  result_label?: string;
  public_notes?: string | null;
  installation_conditions?: string | null;
  rule_scope?: string;
};
type PublicQueryRecord = {
  ok?: boolean;
  error?: string;
  request_id?: string;
  protocol?: string;
  status?: "analise_necessaria" | "compativel" | "incompativel" | "compativel_com_condicoes";
  public_result?: string;
  matched_by_rule?: boolean;
  conflict_detected?: boolean;
  match_priority?: number | null;
  recommended_products?: ProductRecommendation[];
  evaluated_results?: ProductRecommendation[];
  photos_expire_at?: string;
};
type RateLimitResult = {
  allowed?: boolean;
  limit?: number;
  remaining?: number;
  retry_after?: number;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = 3 * Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 64 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class InputError extends Error { constructor(public status: number) { super("invalid_request"); } }
function logFailure(event: string, requestId = crypto.randomUUID()) {
  console.error(JSON.stringify({ level: "error", event, request_id: requestId }));
}
async function limitedJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new InputError(415);
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw new InputError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError(400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new InputError(413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch { throw new InputError(400); }
}
// This is transport timeout only; all authorization remains on the server.
async function backendFetch(input: string, init: RequestInit = {}) {
  return await fetch(input, { ...init, signal: AbortSignal.timeout(15000) });
}

function response(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...headers } });
}

function authHeaders(extra: Record<string, string> = {}) {
  return { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}`, ...extra };
}

function safeText(value: unknown, max = 240) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function safeIntegerArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((item) => Number.isSafeInteger(item) && item > 0))].slice(0, 100);
}

function decodeBase64(value: string) {
  const raw = atob(value);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function imageSignatureMatches(contentType: string, bytes: Uint8Array) {
  if (contentType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === "image/png") {
    return bytes.length >= 8
      && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  }
  if (contentType === "image/webp") {
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}

async function internalTokenMatches(candidate: string) {
  if (!candidate || !INTERNAL_TOKEN) return false;
  const encoder = new TextEncoder();
  const [candidateHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(INTERNAL_TOKEN)),
  ]);
  const left = new Uint8Array(candidateHash);
  const right = new Uint8Array(expectedHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function getAdmin(request: Request): Promise<AdminUser | null> {
  const internalToken = request.headers.get("x-ohc-internal-token") ?? "";
  if (await internalTokenMatches(internalToken)) {
    return {
      email: safeText(request.headers.get("x-ohc-admin-email"), 160) || "site-admin@ohcmotorsbr.com.br",
      app_metadata: { role: "ohc_admin" },
    };
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const authResponse = await backendFetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, authorization },
  });
  if (!authResponse.ok) return null;
  const user = await authResponse.json() as AdminUser;
  if (user.app_metadata?.role !== "ohc_admin" || !user.id) return null;
  // Decode only AFTER Auth verified signature, expiry and identity; then check revocation.
  try {
    const encoded = authorization.slice(7).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    if (!UUID.test(claims.session_id ?? "") || claims.sub !== user.id) return null;
    const active = await rpc("ohc_audit_session_active", { p_session_id: claims.session_id, p_user_id: user.id });
    return active === true ? user : null;
  } catch { return null; }
}

async function rest(path: string, init: RequestInit = {}) {
  const restResponse = await backendFetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers || {}) },
  });
  const text = await restResponse.text();
  if (!restResponse.ok) throw new Error(`backend_status_${restResponse.status}`);
  return text ? JSON.parse(text) : null;
}

async function rpc(name: string, payload: Record<string, unknown>) {
  return await rest(`rpc/${name}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function cleanupExpired() {
  const expired = await rest(
    "compatibility_request_photos?select=id,object_path&delete_after=lt." +
      encodeURIComponent(new Date().toISOString()) + "&limit=200",
  ) as Array<{ id: string; object_path: string }>;
  let deleted = 0;
  for (const photo of expired || []) {
    const encodedPath = photo.object_path.split("/").map(encodeURIComponent).join("/");
    const storageResponse = await backendFetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodedPath}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (storageResponse.ok || storageResponse.status === 404) {
      await rest(`compatibility_request_photos?id=eq.${photo.id}`, { method: "DELETE" });
      deleted++;
    }
  }
  return deleted;
}

async function signedPhotoUrl(objectPath: string) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const signResponse = await backendFetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${encodedPath}`, {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ expiresIn: 600 }),
  });
  if (!signResponse.ok) return null;
  const signed = await signResponse.json() as { signedURL?: string; signedUrl?: string };
  const relative = signed.signedURL ?? signed.signedUrl;
  return relative ? `${SUPABASE_URL}/storage/v1${relative}` : null;
}

async function activeProducts() {
  return await rest(
    "catalog_products?select=id,sku,marca,nome_produto,slug,imagem_principal&ativo=is.true&sku=not.is.null&order=marca.asc,nome_produto.asc&limit=500",
  );
}

async function recordPublicQuery(input: {
  brand: string;
  model: string;
  year: number;
  version: string | null;
  generation: string | null;
  chassis: string | null;
  motorization: string | null;
  question: string | null;
  consent: boolean;
}) {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  for (let attempt = 0; attempt < 3; attempt++) {
    const protocol = `OHC-${day}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const result = await rpc("ohc_record_public_compatibility_query", {
      p_protocol: protocol,
      p_vehicle_brand: input.brand,
      p_vehicle_model: input.model,
      p_vehicle_year: input.year,
      p_vehicle_version: input.version,
      p_vehicle_generation: input.generation,
      p_chassis_platform: input.chassis,
      p_motorization: input.motorization,
      p_question: input.question,
      p_consent_data_images: input.consent,
    }) as PublicQueryRecord;
    if (result?.ok === true) return result;
    if (result?.error !== "protocol_collision") throw new Error(result?.error || "public_query_failed");
  }
  throw new Error("protocol_collision");
}

async function submit(payload: Record<string, unknown>) {
  const brand = safeText(payload.vehicle_brand, 80);
  const model = safeText(payload.vehicle_model, 120);
  const year = Number(payload.vehicle_year);
  const vehicleVersion = safeText(payload.vehicle_version, 120) || null;
  const generation = safeText(payload.vehicle_generation, 120) || null;
  const chassis = safeText(payload.vehicle_chassis_platform, 120)
    || safeText(payload.generation_chassis, 120)
    || null;
  const motorization = safeText(payload.vehicle_motorization, 120) || null;
  const notes = safeText(payload.current_steering_notes, 1000) || null;
  const files = Array.isArray(payload.files) ? payload.files as Array<Record<string, unknown>> : [];

  if (!brand || !model || !Number.isInteger(year) || year < 1950 || year > 2100) {
    return response({ error: "Preencha marca, modelo e ano do veículo." }, 400);
  }
  if (payload.consent_data_images !== true) {
    return response({ error: "Autorize o uso dos dados técnicos anônimos para realizar a consulta." }, 400);
  }
  if (payload.files !== undefined && !Array.isArray(payload.files)) return response({ error: "Lista de imagens inválida." }, 400);
  if (files.length > 3) return response({ error: "Envie no máximo três imagens." }, 400);

  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  for (const file of files) {
    if (!file || typeof file !== "object") return response({ error: "Imagem inválida." }, 400);
    const contentType = String(file.content_type);
    if (!allowed.has(contentType) || typeof file.data !== "string") {
      return response({ error: "Use imagens JPG, PNG ou WebP." }, 400);
    }
    if (!Number.isSafeInteger(Number(file.size)) || Number(file.size) <= 0 || Number(file.size) > MAX_IMAGE_BYTES || file.data.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) {
      return response({ error: "Cada imagem deve ter no máximo 5 MB." }, 400);
    }
    try {
      const bytes = decodeBase64(file.data);
      if (bytes.length !== Number(file.size) || !imageSignatureMatches(contentType, bytes)) {
        return response({ error: "O conteúdo de uma das imagens é inválido." }, 400);
      }
    } catch {
      return response({ error: "Não foi possível validar uma das imagens." }, 400);
    }
  }

  const rateLimit = await rpc("ohc_consume_public_rate_limit", {}) as RateLimitResult;
  if (rateLimit?.allowed !== true) {
    const retryAfter = Math.max(1, Number(rateLimit?.retry_after) || 60);
    return response({
      error: "Muitas consultas foram enviadas neste momento. Aguarde um pouco e tente novamente.",
      retry_after: retryAfter,
    }, 429, { "retry-after": String(retryAfter) });
  }

  const created = await recordPublicQuery({
    brand,
    model,
    year,
    version: vehicleVersion,
    generation,
    chassis,
    motorization,
    question: notes,
    consent: payload.consent_data_images === true,
  });
  if (!created.request_id || !created.protocol) throw new Error("public_query_missing_id");

  let photoWarning = false;
  for (const file of files) {
    let objectPath = "";
    try {
      const contentType = String(file.content_type);
      const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      objectPath = `${created.request_id}/${crypto.randomUUID()}.${extension}`;
      const bytes = decodeBase64(String(file.data));
      const upload = await backendFetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
        method: "POST",
        headers: authHeaders({ "content-type": contentType, "x-upsert": "false" }),
        body: bytes,
      });
      if (!upload.ok) throw new Error(await upload.text());
      await rest("compatibility_request_photos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request_id: created.request_id,
          object_path: objectPath,
          original_name: safeText(file.name, 180) || `foto.${extension}`,
          content_type: contentType,
          size_bytes: bytes.length,
          delete_after: created.photos_expire_at,
        }),
      });
    } catch (error) {
      photoWarning = true;
      logFailure("photo_upload_failed");
      if (objectPath) {
        const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
        await backendFetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodedPath}`, {
          method: "DELETE",
          headers: authHeaders(),
        }).catch(() => undefined);
      }
    }
  }

  await cleanupExpired().catch(() => logFailure("photo_cleanup_failed"));
  return response({
    protocol: created.protocol,
    status: created.status,
    public_result: created.public_result,
    matched_by_rule: created.matched_by_rule === true,
    conflict_detected: created.conflict_detected === true,
    match_priority: created.match_priority ?? null,
    recommended_products: created.recommended_products ?? [],
    evaluated_results: created.evaluated_results ?? [],
    photos_expire_at: created.photos_expire_at,
    photo_warning: photoWarning,
  }, 201);
}

async function adminDashboard() {
  const [requests, products] = await Promise.all([
    rest(
      "compatibility_requests?select=id,protocol,status,vehicle_brand,vehicle_model,vehicle_year,vehicle_version,vehicle_generation,vehicle_chassis_platform,vehicle_motorization,generation_chassis,current_steering_notes,recommended_product_skus,decision_source,conflict_detected,reviewed_by,reviewed_at,created_at,photos_expire_at&order=created_at.desc&limit=200",
    ),
    activeProducts(),
  ]);
  const rows = Array.isArray(requests) ? requests : [];
  return response({
    requests: rows,
    products,
    stats: {
      total: rows.length,
      pending: rows.filter((item) => item.status === "analise_necessaria").length,
      compatible: rows.filter((item) => item.status === "compativel").length,
      conditional: rows.filter((item) => item.status === "compativel_com_condicoes").length,
      incompatible: rows.filter((item) => item.status === "incompativel").length,
    },
  });
}

async function adminDetail(payload: Record<string, unknown>) {
  const requestId = safeText(payload.id, 80);
  if (!UUID.test(requestId)) return response({ error: "Solicitação inválida." }, 400);

  const [context, photos] = await Promise.all([
    rpc("ohc_get_admin_compatibility_context", { p_request_id: requestId }),
    rest(
      "compatibility_request_photos?select=id,object_path,original_name,content_type,size_bytes,created_at,delete_after&request_id=eq." +
        encodeURIComponent(requestId) + "&order=created_at.asc&limit=3",
    ) as Promise<Array<Record<string, unknown>>>,
  ]);

  if (context?.ok !== true) return response({ error: "Solicitação não encontrada." }, 404);
  const signedPhotos = await Promise.all((photos || []).map(async (photo) => ({
    ...photo,
    signed_url: await signedPhotoUrl(String(photo.object_path)),
  })));
  return response({ ...context, photos: signedPhotos });
}

async function saveDecision(payload: Record<string, unknown>, reviewedBy: string) {
  if (!UUID.test(String(payload.id ?? ""))) return response({ error: "Solicitação inválida." }, 400);
  const result = await rpc("ohc_save_compatibility_decision_v2", {
    p_request_id: safeText(payload.id, 80),
    p_status: safeText(payload.status, 50),
    p_product_ids: safeIntegerArray(payload.product_ids),
    p_public_notes: safeText(payload.public_notes, 1600) || null,
    p_internal_notes: safeText(payload.internal_notes, 2000) || null,
    p_installation_conditions: safeText(payload.installation_conditions, 1600) || null,
    p_confidence_level: safeText(payload.confidence_level, 30) || "confirmed",
    p_rule_scope: safeText(payload.rule_scope, 40) || "model_year_range",
    p_year_from: safeInteger(payload.year_from),
    p_year_to: safeInteger(payload.year_to),
    p_reviewed_by: reviewedBy,
    p_save_rule: payload.save_rule === true,
    p_replace_conflicts: payload.replace_conflicts === true,
    p_scope_explicitly_approved: payload.scope_explicitly_approved === true,
    p_change_reason: safeText(payload.change_reason, 1000) || null,
  }) as Record<string, unknown>;

  if (result?.ok !== true) {
    if (result?.conflict === true) {
      return response({
        error: "Existem regras conflitantes. Compare as respostas e confirme a correção.",
        ...result,
      }, 409);
    }
    const messages: Record<string, string> = {
      request_not_found: "Solicitação não encontrada.",
      invalid_status: "Resultado selecionado é inválido.",
      invalid_scope: "Escopo selecionado é inválido.",
      invalid_confidence: "Nível de confiança inválido.",
      invalid_year_range: "A faixa de anos informada é inválida.",
      active_products_required: "Selecione ao menos um produto ativo.",
      conditions_required: "Descreva as condições ou adaptações necessárias.",
      version_required_for_exact_scope: "Informe a versão antes de usar o escopo exato.",
      explicit_generation_approval_required: "Confirme explicitamente a aplicação para toda a geração.",
      explicit_chassis_approval_required: "Confirme explicitamente a aplicação para todo o chassi/plataforma.",
    };
    const code = safeText(result?.error, 100);
    return response({ error: messages[code] || "Não foi possível salvar a decisão.", code }, 400);
  }

  return response({ decision: result });
}

async function deactivateRule(payload: Record<string, unknown>, reviewedBy: string) {
  if (!UUID.test(String(payload.rule_id ?? ""))) return response({ error: "Regra inválida." }, 400);
  const result = await rpc("ohc_deactivate_compatibility_rule", {
    p_rule_id: safeText(payload.rule_id, 80),
    p_actor: reviewedBy,
    p_reason: safeText(payload.change_reason, 1000) || null,
  }) as Record<string, unknown>;
  if (result?.ok !== true) return response({ error: "Regra não encontrada." }, 404);
  return response({ decision: result });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return response({ error: "Método não permitido." }, 405);
  try {
    const internal = await internalTokenMatches(request.headers.get("x-ohc-internal-token") ?? "");
    const authenticatedAdmin = internal ? null : await getAdmin(request);
    if (!internal && !authenticatedAdmin?.email) return response({ error: "Não autorizado." }, 401);
    const payload = await limitedJson(request);
    if (payload.action === "submit") {
      const internalToken = request.headers.get("x-ohc-internal-token") ?? "";
      if (!await internalTokenMatches(internalToken)) return response({ error: "Não autorizado." }, 401);
      return await submit(payload);
    }

    const admin = authenticatedAdmin ?? await getAdmin(request);
    if (!admin?.email) return response({ error: "Não autorizado." }, 401);
    if (payload.action === "products") return response({ products: await activeProducts() });
    if (payload.action === "cleanup") return response({ deleted: await cleanupExpired() });
    if (payload.action === "admin_dashboard" || payload.action === "list") return await adminDashboard();
    if (payload.action === "admin_detail") return await adminDetail(payload);
    if (payload.action === "save_decision_v2") return await saveDecision(payload, admin.email);
    if (payload.action === "deactivate_rule") return await deactivateRule(payload, admin.email);
    return response({ error: "Ação inválida." }, 400);
  } catch (error) {
    if (error instanceof InputError) return response({ error: "Requisição inválida." }, error.status);
    const requestId = crypto.randomUUID();
    logFailure("request_failed", requestId);
    return response({ error: "Não foi possível concluir a solicitação.", request_id: requestId }, 500);
  }
});

