import { resolveImage } from "../lib/products";
import { useEffect, useMemo, useState } from "react";
import { adminAction, adminManage, type AdminUser } from "../lib/adminApi";

type FallbackProduct = {
  id: number;
  sku: string;
  marca?: string | null;
  nome_produto?: string | null;
  slug?: string | null;
  imagem_principal?: string | null;
};
type AdminProduct = FallbackProduct & {
  categoria?: string | null;
  tipo_produto?: string | null;
  material?: string | null;
  cor?: string | null;
  recursos?: string | null;
  descricao?: string | null;
  sku_aliases?: string | null;
  outras_imagens?: string | null;
  geracao_chassi?: string | null;
  ano_inicio?: number | null;
  ano_fim?: number | null;
  tipo_cubo_adaptador?: string | null;
  observacoes_airbag_comandos?: string | null;
  formato_aro?: string | null;
  paddle_shift?: boolean | null;
  comandos_multifuncionais?: boolean | null;
  shift_light?: string | null;
  compatibilidade?: string | null;
  ativo?: boolean;
  updated_at?: string;
  price_record?: {
    price?: number | null;
    promotional_price?: number | null;
    active?: boolean;
    source_document?: string | null;
  } | null;
};
type MediaAsset = {
  id?: string;
  name: string;
  path: string;
  public_url: string;
  created_at?: string;
  updated_at?: string;
  metadata?: { size?: number; mimetype?: string };
};
type AdminAccount = {
  id: string;
  email: string;
  role: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  created_at?: string | null;
};
type AuditEvent = {
  id: string;
  rule_id?: string | null;
  request_id?: string | null;
  action: string;
  previous_status?: string | null;
  new_status?: string | null;
  actor?: string | null;
  change_reason?: string | null;
  previous_rule_version?: number | null;
  new_rule_version?: number | null;
  details?: any;
  created_at: string;
};
type SettingsInfo = {
  backend_management_configured: boolean;
  supabase_url: string;
  assets_bucket: string;
  configured_email_allowlist: string[];
  counts: {
    products: number;
    active_products: number;
    inactive_products: number;
    products_without_image: number;
    admins: number;
    active_rules: number;
  };
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function ManagementError({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-lg border border-ohc-red/35 bg-ohc-red/10 p-4 text-sm leading-relaxed text-[#FFD0D2]">
      {error}
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-xl border border-[#D6A545]/35 bg-[#D6A545]/[.07] p-5 text-sm leading-relaxed text-[#E8C77E]">
      <b className="block text-ohc-text">
        Gestão avançada aguardando variável segura do servidor
      </b>
      Produtos completos, mídia, administradores e auditoria usam{" "}
      <code className="rounded-sm bg-black/30 px-1.5 py-0.5 text-xs">
        SUPABASE_SERVICE_ROLE_KEY
      </code>{" "}
      somente na função server-side da Vercel. A chave nunca é enviada ao
      navegador.
    </div>
  );
}

function PanelLoading({
  label = "Carregando dados administrativos",
}: {
  label?: string;
}) {
  return (
    <div className="admin-card grid min-h-52 place-items-center p-8 text-center">
      <div>
        <div className="ub-dots">
          <i />
          <i />
          <i />
        </div>
        <p className="mt-4 text-xs uppercase tracking-[.16em] text-ohc-steel">
          {label}
        </p>
      </div>
    </div>
  );
}

export function ProductManagementView({
  fallbackProducts,
}: {
  fallbackProducts: FallbackProduct[];
}) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminManage<{ products: AdminProduct[] }>({
        action: "products_list",
      });
      setProducts(data.products || []);
    } catch (e: any) {
      if (e?.status === 503)
        setProducts(fallbackProducts.map((p) => ({ ...p, ativo: true })));
      setError(
        e?.message || "Não foi possível carregar os produtos completos.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(
    () =>
      products.filter((p) => {
        if (status === "active" && !p.ativo) return false;
        if (status === "inactive" && p.ativo) return false;
        const q = query.trim().toLowerCase();
        return (
          !q ||
          [p.sku, p.nome_produto, p.marca, p.categoria, p.tipo_produto]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      }),
    [products, query, status],
  );

  const toggle = async (product: AdminProduct) => {
    const next = !product.ativo;
    if (
      !next &&
      !window.confirm(
        `Desativar ${product.sku}? O produto deixará de aparecer nas leituras públicas que respeitam o campo ativo.`,
      )
    )
      return;
    setError("");
    setNotice("");
    try {
      await adminManage({
        action: "product_toggle",
        id: product.id,
        active: next,
      });
      setNotice(
        `${product.sku} ${next ? "ativado" : "desativado"} com sucesso.`,
      );
      await load();
    } catch (e: any) {
      setError(e.message || "Não foi possível alterar o status.");
    }
  };

  if (loading) return <PanelLoading label="Carregando produtos" />;
  return (
    <>
      <ManagementError error={error} />
      {notice && (
        <div className="mb-4 rounded-lg border border-[#43C981]/30 bg-[#43C981]/10 p-3 text-sm text-[#A9EFC7]">
          {notice}
        </div>
      )}
      <div className="mb-4 rounded-xl border border-ohc-blue/25 bg-ohc-blue/5 p-4 text-xs leading-relaxed text-ohc-steel">
        <b className="text-ohc-text">Banco atual:</b> o catálogo possui o campo{" "}
        <code>ativo</code>, mas não possui um campo separado{" "}
        <code>publicado</code>. Por isso o painel não cria um status fictício;
        publicação separada exigirá uma migration específica antes de ser
        habilitada.
      </div>
      {error.includes("SUPABASE_SERVICE_ROLE_KEY") && (
        <div className="mb-4">
          <SetupNotice />
        </div>
      )}
      <section className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ohc-line p-4 lg:flex-row lg:items-center">
          <input
            className="admin-input flex-1"
            placeholder="Buscar SKU, nome, marca ou categoria…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="admin-input lg:w-44"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <button
            className="btn btn-blue min-h-11! px-4! py-2! text-xs"
            onClick={() => {
              setEditing(null);
              setCreating(true);
            }}
          >
            Novo produto
          </button>
        </div>
        <div className="hidden grid-cols-[88px_1fr_150px_110px_150px] gap-4 border-b border-ohc-line bg-white/1.5 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-ohc-steel lg:grid">
          <span>SKU</span>
          <span>Produto</span>
          <span>Marca</span>
          <span>Status</span>
          <span>Ações</span>
        </div>
        <div className="divide-y divide-ohc-line">
          {shown.map((p) => (
            <div
              key={p.id}
              className="grid gap-3 px-4 py-4 lg:grid-cols-[88px_1fr_150px_110px_150px] lg:items-center"
            >
              <div className="font-mono text-[11px] text-ohc-glow">{p.sku}</div>
              <div className="flex min-w-0 items-center gap-3">
                {p.imagem_principal ? (
                  <img
                    src={resolveImage(p.imagem_principal) || undefined}
                    alt=""
                    className="h-12 w-12 rounded-md border border-ohc-line bg-white object-contain p-1"
                  />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-md border border-dashed border-ohc-line text-[9px] text-ohc-steel">
                    SEM FOTO
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">
                    {p.nome_produto || "Sem nome"}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-ohc-steel">
                    {p.categoria || p.tipo_produto || "Sem categoria"}
                    {p.price_record?.price
                      ? ` · R$ ${Number(p.price_record.price).toLocaleString("pt-BR")}`
                      : ""}
                  </div>
                </div>
              </div>
              <div className="text-xs text-ohc-steel">{p.marca || "—"}</div>
              <div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${p.ativo ? "border-[#43C981]/30 text-[#93F1BD]" : "border-ohc-line text-ohc-steel"}`}
                >
                  {p.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-xs font-bold text-ohc-glow hover:text-white"
                  onClick={() => {
                    setCreating(false);
                    setEditing(p);
                  }}
                >
                  Editar
                </button>
                <button
                  className="text-xs font-bold text-ohc-steel hover:text-white"
                  onClick={() => toggle(p)}
                >
                  {p.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {!shown.length && (
          <div className="p-10 text-center text-sm text-ohc-steel">
            Nenhum produto encontrado.
          </div>
        )}
      </section>
      {(editing || creating) && (
        <ProductEditor
          product={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={async () => {
            setEditing(null);
            setCreating(false);
            setNotice("Produto salvo com sucesso.");
            await load();
          }}
        />
      )}
    </>
  );
}

function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<any>(() => ({
    id: product?.id,
    sku: product?.sku || "",
    nome_produto: product?.nome_produto || "",
    slug: product?.slug || "",
    marca: product?.marca || "",
    categoria: product?.categoria || "",
    tipo_produto: product?.tipo_produto || "",
    material: product?.material || "",
    cor: product?.cor || "",
    recursos: product?.recursos || "",
    descricao: product?.descricao || "",
    imagem_principal: product?.imagem_principal || "",
    outras_imagens: product?.outras_imagens || "",
    geracao_chassi: product?.geracao_chassi || "",
    ano_inicio: product?.ano_inicio || "",
    ano_fim: product?.ano_fim || "",
    compatibilidade: product?.compatibilidade || "",
    tipo_cubo_adaptador: product?.tipo_cubo_adaptador || "",
    observacoes_airbag_comandos: product?.observacoes_airbag_comandos || "",
    formato_aro: product?.formato_aro || "",
    paddle_shift: Boolean(product?.paddle_shift),
    comandos_multifuncionais: Boolean(product?.comandos_multifuncionais),
    shift_light: product?.shift_light || "",
    ativo: product?.ativo ?? true,
    price: product?.price_record?.price || "",
    promotional_price: product?.price_record?.promotional_price || "",
    price_active: Boolean(product?.price_record?.active),
    source_document:
      product?.price_record?.source_document || "Painel administrativo OHC",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const field = (name: string, value: any) =>
    setForm((current: any) => ({ ...current, [name]: value }));
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await adminManage({ action: "product_save", product: form });
      await onSaved();
    } catch (e: any) {
      setError(e.message || "Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-120 bg-black/75 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="absolute inset-y-0 right-0 w-full max-w-[850px] overflow-y-auto border-l border-ohc-line bg-[#090C11]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-ohc-line bg-[#090C11]/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <div className="eyebrow">Produto</div>
            <h2 className="mt-1 font-body text-lg font-bold">
              {product ? `Editar ${product.sku}` : "Cadastrar novo produto"}
            </h2>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg border border-ohc-line text-xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-5">
          <ManagementError error={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU *">
              <input
                className="admin-input"
                value={form.sku}
                onChange={(e) => field("sku", e.target.value)}
              />
            </Field>
            <Field label="Nome do produto *">
              <input
                className="admin-input"
                value={form.nome_produto}
                onChange={(e) => field("nome_produto", e.target.value)}
              />
            </Field>
            <Field label="Marca">
              <input
                className="admin-input"
                value={form.marca}
                onChange={(e) => field("marca", e.target.value)}
              />
            </Field>
            <Field label="Categoria">
              <input
                className="admin-input"
                value={form.categoria}
                onChange={(e) => field("categoria", e.target.value)}
              />
            </Field>
            <Field label="Tipo do produto">
              <input
                className="admin-input"
                value={form.tipo_produto}
                onChange={(e) => field("tipo_produto", e.target.value)}
              />
            </Field>
            <Field label="Slug">
              <input
                className="admin-input"
                value={form.slug}
                onChange={(e) => field("slug", e.target.value)}
              />
            </Field>
            <Field label="Material">
              <input
                className="admin-input"
                value={form.material}
                onChange={(e) => field("material", e.target.value)}
              />
            </Field>
            <Field label="Cor">
              <input
                className="admin-input"
                value={form.cor}
                onChange={(e) => field("cor", e.target.value)}
              />
            </Field>
            <Field label="Ano inicial">
              <input
                type="number"
                className="admin-input"
                value={form.ano_inicio}
                onChange={(e) => field("ano_inicio", e.target.value)}
              />
            </Field>
            <Field label="Ano final">
              <input
                type="number"
                className="admin-input"
                value={form.ano_fim}
                onChange={(e) => field("ano_fim", e.target.value)}
              />
            </Field>
            <Field label="Imagem principal">
              <input
                className="admin-input"
                value={form.imagem_principal}
                onChange={(e) => field("imagem_principal", e.target.value)}
                placeholder="URL ou caminho público"
              />
            </Field>
            <Field label="Outras imagens">
              <input
                className="admin-input"
                value={form.outras_imagens}
                onChange={(e) => field("outras_imagens", e.target.value)}
                placeholder="Conforme padrão atual do banco"
              />
            </Field>
            <Field label="Preço">
              <input
                type="number"
                step="0.01"
                className="admin-input"
                value={form.price}
                onChange={(e) => field("price", e.target.value)}
              />
            </Field>
            <Field label="Preço promocional">
              <input
                type="number"
                step="0.01"
                className="admin-input"
                value={form.promotional_price}
                onChange={(e) => field("promotional_price", e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4 grid gap-4">
            <Field label="Descrição">
              <textarea
                className="admin-input min-h-24 resize-y"
                value={form.descricao}
                onChange={(e) => field("descricao", e.target.value)}
              />
            </Field>
            <Field label="Compatibilidade descritiva">
              <textarea
                className="admin-input min-h-24 resize-y"
                value={form.compatibilidade}
                onChange={(e) => field("compatibilidade", e.target.value)}
              />
            </Field>
            <Field label="Recursos">
              <textarea
                className="admin-input min-h-20 resize-y"
                value={form.recursos}
                onChange={(e) => field("recursos", e.target.value)}
              />
            </Field>
            <Field label="Geração / chassi">
              <input
                className="admin-input"
                value={form.geracao_chassi}
                onChange={(e) => field("geracao_chassi", e.target.value)}
              />
            </Field>
            <Field label="Observações de airbag / comandos">
              <textarea
                className="admin-input min-h-20 resize-y"
                value={form.observacoes_airbag_comandos}
                onChange={(e) =>
                  field("observacoes_airbag_comandos", e.target.value)
                }
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-5 rounded-lg border border-ohc-line bg-white/2 p-4 text-xs">
            <Check
              label="Produto ativo"
              checked={form.ativo}
              onChange={(v) => field("ativo", v)}
            />
            <Check
              label="Paddle shift"
              checked={form.paddle_shift}
              onChange={(v) => field("paddle_shift", v)}
            />
            <Check
              label="Comandos multifuncionais"
              checked={form.comandos_multifuncionais}
              onChange={(v) => field("comandos_multifuncionais", v)}
            />
            <Check
              label="Preço ativo"
              checked={form.price_active}
              onChange={(v) => field("price_active", v)}
            />
          </div>
          <div className="mt-5 flex gap-3">
            <button className="btn btn-ghost flex-1" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-blue flex-1"
              disabled={saving || !form.sku.trim() || !form.nome_produto.trim()}
              onClick={save}
            >
              {saving ? "Salvando…" : "Salvar produto"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function MediaManagementView() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminManage<{ media: MediaAsset[] }>({
        action: "media_list",
      });
      setMedia(data.media || []);
    } catch (e: any) {
      setError(e.message || "Falha ao carregar mídia.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    setNotice("");
    try {
      if (!["image/webp"].includes(file.type))
        throw new Error("Envie uma imagem WebP.");
      if (file.size > 2.5 * 1024 * 1024)
        throw new Error("Arquivo maior que 2,5 MB para upload pelo painel.");
      const data = await fileToDataUrl(file);
      await adminManage({
        action: "media_upload",
        name: file.name,
        content_type: file.type,
        data,
      });
      setNotice("Arquivo enviado para site-assets.");
      await load();
    } catch (e: any) {
      setError(e.message || "Falha no upload.");
    } finally {
      setUploading(false);
    }
  };
  const remove = async (asset: MediaAsset) => {
    if (
      !window.confirm(`Excluir ${asset.path}? Esta ação não pode ser desfeita.`)
    )
      return;
    setError("");
    try {
      await adminManage({ action: "media_delete", path: asset.path });
      await load();
    } catch (e: any) {
      setError(e.message || "Falha ao excluir arquivo.");
    }
  };
  if (loading) return <PanelLoading label="Carregando mídia" />;
  return (
    <>
      <ManagementError error={error} />
      {error.includes("SUPABASE_SERVICE_ROLE_KEY") && (
        <div className="mb-4">
          <SetupNotice />
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-[#43C981]/30 bg-[#43C981]/10 p-3 text-sm text-[#A9EFC7]">
          {notice}
        </div>
      )}
      <section className="admin-card p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Storage</p>
            <h2 className="mt-1 font-body text-lg font-bold">Mídia do site</h2>
            <p className="mt-2 text-xs text-ohc-steel">
              Bucket atual: <code>site-assets</code>. Upload WebP; o painel
              limita cada upload a 2,5 MB para manter margem no transporte
              server-side.
            </p>
          </div>
          <label
            className={`btn btn-blue cursor-pointer py-2! text-xs ${uploading ? "pointer-events-none opacity-50" : ""}`}
          >
            {uploading ? "Enviando…" : "Enviar arquivo"}
            <input
              type="file"
              accept="image/webp"
              className="hidden"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {media.map((asset) => (
            <article
              key={asset.id || asset.path}
              className="overflow-hidden rounded-xl border border-ohc-line bg-[#090C11]"
            >
              <a
                href={asset.public_url}
                target="_blank"
                rel="noreferrer"
                className="grid aspect-video place-items-center bg-white/2.5 p-3"
              >
                <img
                  src={asset.public_url}
                  alt={asset.name}
                  className="max-h-full max-w-full object-contain"
                />
              </a>
              <div className="p-3">
                <div className="truncate text-xs font-bold" title={asset.path}>
                  {asset.path}
                </div>
                <div className="mt-1 text-[10px] text-ohc-steel">
                  {formatDate(asset.created_at)}
                </div>
                <button
                  disabled={!asset.path.startsWith("admin/")}
                  onClick={() => remove(asset)}
                  className="mt-3 text-[11px] font-bold text-[#FF9FA3] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
        {!media.length && (
          <div className="mt-5 rounded-lg border border-dashed border-ohc-line p-10 text-center text-sm text-ohc-steel">
            Nenhum arquivo encontrado no bucket.
          </div>
        )}
      </section>
    </>
  );
}

export function AdminsManagementView({
  currentUser,
}: {
  currentUser: AdminUser | null;
}) {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminManage<{ admins: AdminAccount[] }>({
        action: "admins_list",
      });
      setAdmins(data.admins || []);
    } catch (e: any) {
      setError(e.message || "Falha ao carregar administradores.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const grant = async () => {
    const value = email.trim().toLowerCase();
    if (!value) return;
    setError("");
    setNotice("");
    try {
      await adminManage({
        action: "admin_set_role",
        email: value,
        make_admin: true,
      });
      setEmail("");
      setNotice(`Acesso administrativo concedido a ${value}.`);
      await load();
    } catch (e: any) {
      setError(e.message || "Não foi possível conceder acesso.");
    }
  };
  const revoke = async (admin: AdminAccount) => {
    if (!window.confirm(`Remover o acesso administrativo de ${admin.email}?`))
      return;
    setError("");
    setNotice("");
    try {
      await adminManage({
        action: "admin_set_role",
        email: admin.email,
        make_admin: false,
      });
      setNotice(`Acesso removido de ${admin.email}.`);
      await load();
    } catch (e: any) {
      setError(e.message || "Não foi possível remover o acesso.");
    }
  };
  if (loading) return <PanelLoading label="Carregando administradores" />;
  return (
    <>
      <ManagementError error={error} />
      {error.includes("SUPABASE_SERVICE_ROLE_KEY") && (
        <div className="mb-4">
          <SetupNotice />
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-[#43C981]/30 bg-[#43C981]/10 p-3 text-sm text-[#A9EFC7]">
          {notice}
        </div>
      )}
      <section className="admin-card p-5">
        <p className="eyebrow">Acesso</p>
        <h2 className="mt-1 font-body text-lg font-bold">
          Administradores OHC
        </h2>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ohc-steel">
          O acesso real depende de <code>app_metadata.role = ohc_admin</code>. O
          servidor impede remover o próprio acesso durante a sessão e impede
          remover o último administrador.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            className="admin-input flex-1"
            placeholder="E-mail de um usuário já existente no Supabase Auth"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-blue py-2! text-xs" onClick={grant}>
            Conceder acesso
          </button>
        </div>
        <div className="mt-5 divide-y divide-ohc-line rounded-xl border border-ohc-line">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div>
                <div className="text-sm font-bold">{admin.email}</div>
                <div className="mt-1 text-[11px] text-ohc-steel">
                  Último acesso: {formatDate(admin.last_sign_in_at)} · Criado:{" "}
                  {formatDate(admin.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-ohc-blue/30 px-2.5 py-1 text-[10px] font-bold uppercase text-[#AFC8FF]">
                  ohc_admin
                </span>
                <button
                  disabled={
                    admin.email.toLowerCase() ===
                    String(currentUser?.email || "").toLowerCase()
                  }
                  onClick={() => revoke(admin)}
                  className="text-xs font-bold text-[#FF9FA3] disabled:opacity-35"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

type GlobalRule = {
  id: string;
  product_id?: number | null;
  product_sku?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  generation_chassis?: string | null;
  vehicle_version?: string | null;
  year_from?: number | null;
  year_to?: number | null;
  status?: string | null;
  active?: boolean;
  rule_scope?: string | null;
  scope_explicitly_approved?: boolean | null;
  public_notes?: string | null;
  internal_notes?: string | null;
  installation_conditions?: string | null;
  confidence_level?: string | null;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  rule_version?: number | null;
  evidence_request_id?: string | null;
  updated_at?: string | null;
};

export function RulesManagementView() {
  const [rules, setRules] = useState<GlobalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<"active" | "inactive" | "all">("active");
  const [status, setStatus] = useState("all");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminManage<{ rules: GlobalRule[] }>({
        action: "rules_list",
      });
      setRules(data.rules || []);
    } catch (e: any) {
      setError(e.message || "Falha ao carregar regras.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const shown = useMemo(
    () =>
      rules.filter((rule) => {
        if (active === "active" && !rule.active) return false;
        if (active === "inactive" && rule.active) return false;
        if (status !== "all" && rule.status !== status) return false;
        const q = query.trim().toLowerCase();
        return (
          !q ||
          [
            rule.product_sku,
            rule.vehicle_brand,
            rule.vehicle_model,
            rule.generation_chassis,
            rule.vehicle_version,
            rule.rule_scope,
            rule.confirmed_by,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      }),
    [rules, query, active, status],
  );
  const deactivate = async (rule: GlobalRule) => {
    const reason = window.prompt(`Motivo para desativar a regra ${rule.id}:`);
    if (!reason?.trim()) return;
    setError("");
    setNotice("");
    try {
      await adminAction({
        action: "deactivate_rule",
        rule_id: rule.id,
        change_reason: reason.trim(),
      });
      setNotice("Regra desativada e registrada na auditoria.");
      await load();
    } catch (e: any) {
      setError(e.message || "Não foi possível desativar a regra.");
    }
  };
  if (loading) return <PanelLoading label="Carregando regras" />;
  return (
    <>
      <ManagementError error={error} />
      {error.includes("SUPABASE_SERVICE_ROLE_KEY") && (
        <div className="mb-4">
          <SetupNotice />
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-[#43C981]/30 bg-[#43C981]/10 p-3 text-sm text-[#A9EFC7]">
          {notice}
        </div>
      )}
      <section className="admin-card overflow-hidden">
        <div className="grid gap-3 border-b border-ohc-line p-4 lg:grid-cols-[1fr_180px_220px_auto]">
          <input
            className="admin-input"
            placeholder="Buscar SKU, veículo, geração, administrador…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="admin-input"
            value={active}
            onChange={(e) => setActive(e.target.value as any)}
          >
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
            <option value="all">Todas</option>
          </select>
          <select
            className="admin-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos os resultados</option>
            <option value="compativel">Compatível</option>
            <option value="compativel_com_condicoes">
              Compatível com condições
            </option>
            <option value="incompativel">Não compatível</option>
          </select>
          <button className="btn btn-ghost py-2! text-xs" onClick={load}>
            Atualizar
          </button>
        </div>
        <div className="border-b border-ohc-line bg-white/1.5 px-4 py-3 text-xs text-ohc-steel">
          <b className="text-ohc-text">{shown.length}</b> regra(s) exibida(s) ·
          novas regras devem ser criadas pela decisão de uma consulta para
          preservar evidência, conflito e auditoria.
        </div>
        <div className="divide-y divide-ohc-line">
          {shown.map((rule) => (
            <article
              key={rule.id}
              className="grid gap-3 p-4 xl:grid-cols-[140px_1.5fr_1fr_160px_120px]"
            >
              <div>
                <div className="font-mono text-[11px] font-bold text-ohc-glow">
                  {rule.product_sku || "—"}
                </div>
                <div className="mt-1 text-[10px] text-ohc-steel">
                  v{rule.rule_version || 1}
                </div>
              </div>
              <div>
                <div className="text-sm font-bold">
                  {rule.vehicle_brand || "—"} {rule.vehicle_model || ""}
                </div>
                <div className="mt-1 text-xs text-ohc-steel">
                  {[rule.generation_chassis, rule.vehicle_version]
                    .filter(Boolean)
                    .join(" · ") || "Sem geração/versão específica"}{" "}
                  · {rule.year_from || "—"}–{rule.year_to || "—"}
                </div>
              </div>
              <div className="text-xs">
                <div className="font-bold">{rule.status || "—"}</div>
                <div className="mt-1 text-ohc-steel">
                  Escopo: {rule.rule_scope || "—"} ·{" "}
                  {rule.confidence_level || "—"}
                </div>
                {rule.installation_conditions && (
                  <div className="mt-1 text-[#E8C77E]">
                    {rule.installation_conditions}
                  </div>
                )}
              </div>
              <div className="text-xs text-ohc-steel">
                <div>{rule.confirmed_by || "—"}</div>
                <div className="mt-1">{formatDate(rule.updated_at)}</div>
              </div>
              <div className="flex items-start justify-end">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${rule.active ? "border-[#43C981]/30 text-[#93F1BD]" : "border-ohc-line text-ohc-steel"}`}
                >
                  {rule.active ? "Ativa" : "Inativa"}
                </span>
                {rule.active && (
                  <button
                    className="ml-3 text-[11px] font-bold text-[#FF9FA3]"
                    onClick={() => deactivate(rule)}
                  >
                    Desativar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!shown.length && (
          <div className="p-10 text-center text-sm text-ohc-steel">
            Nenhuma regra encontrada.
          </div>
        )}
      </section>
    </>
  );
}

export function AuditView() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminManage<{ events: AuditEvent[] }>({
        action: "audit_list",
        limit: 300,
      });
      setEvents(data.events || []);
    } catch (e: any) {
      setError(e.message || "Falha ao carregar auditoria.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const shown = useMemo(
    () =>
      events.filter(
        (event) =>
          !query.trim() ||
          [
            event.action,
            event.actor,
            event.change_reason,
            event.previous_status,
            event.new_status,
            event.rule_id,
            event.request_id,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [events, query],
  );
  if (loading) return <PanelLoading label="Carregando auditoria" />;
  return (
    <>
      <ManagementError error={error} />
      {error.includes("SUPABASE_SERVICE_ROLE_KEY") && (
        <div className="mb-4">
          <SetupNotice />
        </div>
      )}
      <section className="admin-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ohc-line p-4 sm:flex-row">
          <input
            className="admin-input flex-1"
            placeholder="Buscar por ação, administrador, motivo ou regra…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-ghost py-2! text-xs" onClick={load}>
            Atualizar
          </button>
        </div>
        <div className="divide-y divide-ohc-line">
          {shown.map((event) => (
            <article
              key={event.id}
              className="grid gap-3 p-4 lg:grid-cols-[150px_150px_1fr_180px]"
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[.12em] text-ohc-glow">
                  {event.action}
                </div>
                <div className="mt-1 text-xs text-ohc-steel">
                  {formatDate(event.created_at)}
                </div>
              </div>
              <div className="text-xs">
                <b className="block text-ohc-text">
                  {event.actor || "Sistema"}
                </b>
                <span className="mt-1 block text-ohc-steel">
                  v{event.previous_rule_version ?? "—"} → v
                  {event.new_rule_version ?? "—"}
                </span>
              </div>
              <div className="text-xs leading-relaxed">
                <div>
                  <span className="text-ohc-steel">Status:</span>{" "}
                  {event.previous_status || "—"} → {event.new_status || "—"}
                </div>
                {event.change_reason && (
                  <div className="mt-1 text-ohc-steel">
                    {event.change_reason}
                  </div>
                )}
              </div>
              <div className="min-w-0 font-mono text-[10px] text-ohc-steel">
                <div className="truncate" title={event.rule_id || ""}>
                  Regra: {event.rule_id || "—"}
                </div>
                <div className="mt-1 truncate" title={event.request_id || ""}>
                  Consulta: {event.request_id || "—"}
                </div>
              </div>
            </article>
          ))}
        </div>
        {!shown.length && (
          <div className="p-10 text-center text-sm text-ohc-steel">
            Nenhum evento encontrado.
          </div>
        )}
      </section>
    </>
  );
}

export function SettingsView() {
  const [settings, setSettings] = useState<SettingsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminManage<{ settings: SettingsInfo }>({
        action: "settings_info",
      });
      setSettings(data.settings);
    } catch (e: any) {
      setError(e.message || "Falha ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  if (loading) return <PanelLoading label="Carregando configurações" />;
  return (
    <>
      <ManagementError error={error} />
      {error.includes("SUPABASE_SERVICE_ROLE_KEY") && <SetupNotice />}
      {settings && (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="admin-card p-5">
            <p className="eyebrow">Infraestrutura</p>
            <h2 className="mt-1 font-body text-lg font-bold">
              Integração administrativa
            </h2>
            <dl className="mt-5 grid gap-4 text-sm">
              <Setting
                label="Gestão server-side"
                value={
                  settings.backend_management_configured
                    ? "Configurada"
                    : "Não configurada"
                }
              />
              <Setting label="Supabase" value={settings.supabase_url} />
              <Setting label="Bucket de mídia" value={settings.assets_bucket} />
              <Setting
                label="Allowlist adicional"
                value={
                  settings.configured_email_allowlist.length
                    ? settings.configured_email_allowlist.join(", ")
                    : "Não configurada — role ohc_admin é a autorização principal"
                }
              />
            </dl>
          </section>
          <section className="admin-card p-5">
            <p className="eyebrow">Saúde do conteúdo</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="Produtos" value={settings.counts.products} />
              <Metric label="Ativos" value={settings.counts.active_products} />
              <Metric
                label="Inativos"
                value={settings.counts.inactive_products}
              />
              <Metric
                label="Sem imagem"
                value={settings.counts.products_without_image}
              />
              <Metric
                label="Regras ativas"
                value={settings.counts.active_rules}
              />
              <Metric label="Admins" value={settings.counts.admins} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[.14em] text-ohc-steel">
        {label}
      </span>
      {children}
    </label>
  );
}
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-ohc-glow"
      />
      <span>{label}</span>
    </label>
  );
}
function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[.13em] text-ohc-steel">
        {label}
      </dt>
      <dd className="mt-1 break-all font-semibold">{value}</dd>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ohc-line bg-white/2 p-3">
      <div className="font-display text-3xl">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-ohc-steel">
        {label}
      </div>
    </div>
  );
}
function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}
