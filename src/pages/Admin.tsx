import { useEffect, useMemo, useState } from "react";
import {
  adminAction,
  adminAuth,
  adminManage,
  type AdminUser,
} from "../lib/adminApi";
import { useRoute } from "../lib/router";
import {
  ProductManagementView,
  MediaManagementView,
  AdminsManagementView,
  RulesManagementView,
  AuditView,
  SettingsView,
} from "../components/AdminManagement";

type Status =
  | "analise_necessaria"
  | "compativel"
  | "incompativel"
  | "compativel_com_condicoes";
type Tab =
  | "dashboard"
  | "requests"
  | "products"
  | "rules"
  | "media"
  | "admins"
  | "audit"
  | "settings";

type RequestRow = {
  id: string;
  protocol: string;
  status: Status;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_version?: string | null;
  vehicle_generation?: string | null;
  vehicle_chassis_platform?: string | null;
  vehicle_motorization?: string | null;
  generation_chassis?: string | null;
  current_steering_notes?: string | null;
  recommended_product_skus?: string[];
  decision_source?: string;
  conflict_detected?: boolean;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  photos_expire_at?: string | null;
};

type Product = {
  id: number;
  sku: string;
  marca?: string | null;
  nome_produto?: string | null;
  slug?: string | null;
  imagem_principal?: string | null;
};
type Rule = {
  id: string;
  status: string;
  active: boolean;
  scope: string;
  scope_explicitly_approved?: boolean;
  year_from: number;
  year_to: number;
  product_id: number;
  product_sku: string;
  product_name?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_generation?: string | null;
  chassis_platform?: string | null;
  vehicle_version?: string | null;
  public_notes?: string | null;
  internal_notes?: string | null;
  installation_conditions?: string | null;
  confidence_level?: string;
  rule_version?: number;
  updated_at?: string;
};

type DashboardData = {
  requests: RequestRow[];
  products: Product[];
  stats: {
    total: number;
    pending: number;
    compatible: number;
    conditional: number;
    incompatible: number;
  };
};
type AdminSummary = {
  counts: {
    products: number;
    active_products: number;
    inactive_products: number;
    products_without_image: number;
    admins: number;
    active_rules: number;
  };
};

type DetailData = {
  ok: boolean;
  request: RequestRow & {
    question?: string;
    internal_notes?: string;
    query_count?: number;
  };
  similar_cases?: any[];
  vehicle_suggestions?: any[];
  rules?: Rule[];
  conflicts?: any[];
  photos?: Array<{
    id: string;
    original_name: string;
    signed_url?: string | null;
    delete_after?: string;
  }>;
};

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  analise_necessaria: {
    label: "Análise necessária",
    cls: "border-[#D6A545]/35 bg-[#D6A545]/10 text-[#FFD98A]",
  },
  compativel: {
    label: "Compatível",
    cls: "border-[#43C981]/35 bg-[#43C981]/10 text-[#93F1BD]",
  },
  incompativel: {
    label: "Não compatível",
    cls: "border-ohc-red/35 bg-ohc-red/10 text-[#FF9FA3]",
  },
  compativel_com_condicoes: {
    label: "Compatível com condições",
    cls: "border-ohc-blue/35 bg-ohc-blue/10 text-[#AFC8FF]",
  },
};

const SCOPES = [
  ["exact_vehicle_version", "Veículo / versão exata"],
  ["model_year_range", "Modelo + faixa de anos"],
  ["generation", "Toda a geração"],
  ["chassis_platform", "Todo o chassi / plataforma"],
];

function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status] || STATUS_META.analise_necessaria;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}

function fmtDate(value?: string | null) {
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

export default function Admin() {
  const { go, route } = useRoute();
  const [user, setUser] = useState<AdminUser | null>(null);
  const tabFromPath = (): Tab =>
    (
      ({
        "/admin/consultas": "requests",
        "/admin/produtos": "products",
        "/admin/regras": "rules",
        "/admin/midia": "media",
        "/admin/administradores": "admins",
        "/admin/auditoria": "audit",
        "/admin/configuracoes": "settings",
      }) as Record<string, Tab>
    )[route.path] || "dashboard";
  const [tab, setTab] = useState<Tab>(tabFromPath());
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | Status>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setTab(tabFromPath());
  }, [route.path]);
  const openTab = (next: Tab) => {
    const path: Record<Tab, string> = {
      dashboard: "/admin",
      requests: "/admin/consultas",
      products: "/admin/produtos",
      rules: "/admin/regras",
      media: "/admin/midia",
      admins: "/admin/administradores",
      audit: "/admin/auditoria",
      settings: "/admin/configuracoes",
    };
    setTab(next);
    go(path[next]);
  };

  const loadDashboard = async () => {
    setError("");
    try {
      const data = await adminAction<DashboardData>({
        action: "admin_dashboard",
      });
      setDashboard(data);
      try {
        const management = await adminManage<{ settings: AdminSummary }>({
          action: "settings_info",
        });
        setAdminSummary(management.settings);
      } catch {
        setAdminSummary(null);
      }
    } catch (e: any) {
      if (e.status === 401) return go("/admin/login");
      setError(e.message || "Falha ao carregar o painel.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const auth = await adminAuth.me();
        setUser(auth.user);
        await loadDashboard();
      } catch {
        go("/admin/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [go]);

  const openRequest = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    setError("");
    try {
      setDetail(await adminAction<DetailData>({ action: "admin_detail", id }));
    } catch (e: any) {
      if (e.status === 401) go("/admin/login");
      else setError(e.message || "Falha ao abrir consulta.");
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const rows = dashboard?.requests || [];
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "todos" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [
        r.protocol,
        r.vehicle_brand,
        r.vehicle_model,
        r.vehicle_year,
        r.vehicle_version,
        r.vehicle_generation,
        r.generation_chassis,
        ...(r.recommended_product_skus || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [dashboard, query, statusFilter]);

  const logout = async () => {
    try {
      await adminAuth.logout();
    } finally {
      go("/admin/login");
    }
  };

  if (loading)
    return (
      <div className="admin-shell grid min-h-screen place-items-center">
        <div className="text-center">
          <img src="/ohc-logo.webp" alt="OHC Motors" className="mx-auto h-10" />
          <div className="ub-dots mt-7">
            <i />
            <i />
            <i />
          </div>
          <p className="mt-4 text-xs uppercase tracking-[.2em] text-ohc-steel">
            Carregando painel
          </p>
        </div>
      </div>
    );

  return (
    <div className="admin-shell min-h-screen bg-[#080A0E] text-ohc-text">
      <aside className="admin-sidebar">
        <div className="border-b border-ohc-line p-5">
          <img src="/ohc-logo.webp" alt="OHC Motors" className="h-9 w-auto" />
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[.24em] text-ohc-steel">
            Central administrativa
          </p>
        </div>
        <nav className="grid gap-1 p-3">
          {(
            [
              ["dashboard", "Visão geral"],
              ["requests", "Consultas"],
              ["products", "Produtos"],
              ["rules", "Regras"],
              ["media", "Mídia"],
              ["admins", "Administradores"],
              ["audit", "Auditoria"],
              ["settings", "Configurações"],
            ] as Array<[Tab, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => openTab(id)}
              className={`admin-nav-item ${tab === id ? "is-active" : ""}`}
            >
              <span>{label}</span>
              {id === "requests" && dashboard?.stats.pending ? (
                <b>{dashboard.stats.pending}</b>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-ohc-line p-4">
          <div className="truncate text-xs font-semibold">{user?.email}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[.18em] text-ohc-steel">
            Administrador OHC
          </div>
          <button
            onClick={logout}
            className="mt-4 w-full rounded-lg border border-ohc-line px-3 py-2 text-left text-xs font-bold hover:border-ohc-red/60 hover:text-white"
          >
            Sair com segurança
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-ohc-glow">
              OHC Motors
            </p>
            <h1 className="mt-1 font-body text-xl font-bold tracking-tight">
              {
                {
                  dashboard: "Visão geral",
                  requests: "Consultas de compatibilidade",
                  products: "Produtos",
                  rules: "Regras de compatibilidade",
                  media: "Mídia e imagens",
                  admins: "Administradores",
                  audit: "Logs e auditoria",
                  settings: "Configurações",
                }[tab]
              }
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost min-h-10! px-4! py-2! text-xs"
              onClick={() => loadDashboard()}
            >
              Atualizar
            </button>
            <a
              className="btn btn-ghost min-h-10! px-4! py-2! text-xs"
              href="/"
              target="_blank"
              rel="noreferrer"
            >
              Abrir site
            </a>
          </div>
        </header>

        <div className="admin-content">
          {error && (
            <div className="mb-5 rounded-lg border border-ohc-red/35 bg-ohc-red/10 p-4 text-sm text-[#FFD0D2]">
              {error}
            </div>
          )}
          {tab === "dashboard" && dashboard && (
            <DashboardView
              data={dashboard}
              summary={adminSummary}
              openRequest={(id) => {
                openTab("requests");
                openRequest(id);
              }}
            />
          )}
          {tab === "requests" && dashboard && (
            <RequestsView
              rows={filtered}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              openRequest={openRequest}
            />
          )}
          {tab === "products" && (
            <ProductManagementView
              fallbackProducts={dashboard?.products || []}
            />
          )}
          {tab === "media" && <MediaManagementView />}
          {tab === "admins" && <AdminsManagementView currentUser={user} />}
          {tab === "audit" && <AuditView />}
          {tab === "settings" && <SettingsView />}
          {tab === "rules" && <RulesManagementView />}
        </div>
      </main>

      {selectedId && (
        <RequestDrawer
          id={selectedId}
          data={detail}
          products={dashboard?.products || []}
          loading={detailLoading}
          onClose={() => {
            setSelectedId(null);
            setDetail(null);
          }}
          onReload={async () => {
            await openRequest(selectedId);
            await loadDashboard();
          }}
        />
      )}
    </div>
  );
}

function DashboardView({
  data,
  summary,
  openRequest,
}: {
  data: DashboardData;
  summary: AdminSummary | null;
  openRequest: (id: string) => void;
}) {
  const today = new Date().toDateString();
  const todayRequests = data.requests.filter(
    (row) => new Date(row.created_at).toDateString() === today,
  ).length;
  const cards = summary
    ? [
        ["Produtos ativos", summary.counts.active_products, "text-[#93F1BD]"],
        ["Pendentes", data.stats.pending, "text-[#FFD98A]"],
        ["Regras ativas", summary.counts.active_rules, "text-[#AFC8FF]"],
        ["Sem imagem", summary.counts.products_without_image, "text-[#FF9FA3]"],
        ["Consultas hoje", todayRequests, "text-ohc-text"],
        ["Compatíveis", data.stats.compatible, "text-[#93F1BD]"],
      ]
    : [
        ["Pendentes", data.stats.pending, "text-[#FFD98A]"],
        ["Compatíveis", data.stats.compatible, "text-[#93F1BD]"],
        ["Com condições", data.stats.conditional, "text-[#AFC8FF]"],
        ["Não compatíveis", data.stats.incompatible, "text-[#FF9FA3]"],
      ];
  const recent = data.requests.slice(0, 8);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map(([label, value, cls]) => (
          <div key={label as string} className="admin-card p-5">
            <div className={`font-display text-5xl leading-none ${cls}`}>
              {value}
            </div>
            <div className="mt-2 text-xs font-bold uppercase tracking-[.16em] text-ohc-steel">
              {label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="admin-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ohc-line p-5">
            <div>
              <h2 className="font-body text-base font-bold">
                Consultas recentes
              </h2>
              <p className="mt-1 text-xs text-ohc-steel">
                Últimas solicitações registradas no sistema.
              </p>
            </div>
            <span className="text-xs text-ohc-steel">
              {data.stats.total} carregadas
            </span>
          </div>
          <div className="divide-y divide-ohc-line">
            {recent.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openRequest(r.id)}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-4 p-4 text-left hover:bg-white/2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">
                    {r.vehicle_brand} {r.vehicle_model}{" "}
                    <span className="font-normal text-ohc-steel">
                      {r.vehicle_year}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ohc-steel">
                    <span>{r.protocol}</span>
                    <span>{fmtDate(r.created_at)}</span>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </button>
            ))}
          </div>
        </section>
        <section className="admin-card p-5">
          <p className="eyebrow">Memória ativa</p>
          <div className="mt-4 font-display text-5xl leading-none text-[#93F1BD]">
            PRESERVADA
          </div>
          <p className="mt-2 text-sm text-ohc-steel">
            A memória existente continua sendo a fonte de verdade; o painel não
            recria regras do zero.
          </p>
          <div className="mt-6 border-t border-ohc-line pt-5">
            <div className="font-display text-4xl">{data.products.length}</div>
            <p className="mt-1 text-xs uppercase tracking-[.14em] text-ohc-steel">
              produtos ativos disponíveis para seleção
            </p>
          </div>
          <p className="mt-6 rounded-lg border border-ohc-blue/25 bg-ohc-blue/10 p-3 text-xs leading-relaxed text-[#BFD0F6]">
            O painel não recria a base. Novas decisões usam as funções
            existentes de conflito, deduplicação, histórico e escopo.
          </p>
        </section>
      </div>
    </>
  );
}

function RequestsView({
  rows,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  openRequest,
}: {
  rows: RequestRow[];
  query: string;
  setQuery: (v: string) => void;
  statusFilter: "todos" | Status;
  setStatusFilter: (v: "todos" | Status) => void;
  openRequest: (id: string) => void;
}) {
  return (
    <section className="admin-card overflow-hidden">
      <div className="grid gap-3 border-b border-ohc-line p-4 md:grid-cols-[1fr_240px]">
        <input
          className="admin-input"
          placeholder="Buscar protocolo, veículo, SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="admin-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="todos">Todos os status</option>
          <option value="analise_necessaria">Análise necessária</option>
          <option value="compativel">Compatível</option>
          <option value="compativel_com_condicoes">
            Compatível com condições
          </option>
          <option value="incompativel">Não compatível</option>
        </select>
      </div>
      <div className="hidden grid-cols-[1.1fr_1.8fr_.8fr_1fr_.7fr] gap-3 border-b border-ohc-line bg-white/1.5 px-4 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-ohc-steel lg:grid">
        <span>Protocolo</span>
        <span>Veículo</span>
        <span>Data</span>
        <span>Status</span>
        <span></span>
      </div>
      <div className="divide-y divide-ohc-line">
        {rows.map((r) => (
          <button
            type="button"
            key={r.id}
            onClick={() => openRequest(r.id)}
            className="grid w-full gap-3 px-4 py-4 text-left hover:bg-white/2.5 lg:grid-cols-[1.1fr_1.8fr_.8fr_1fr_.7fr] lg:items-center"
          >
            <div>
              <span className="text-xs font-bold">{r.protocol}</span>
              {r.conflict_detected && (
                <span className="ml-2 text-[10px] font-bold text-ohc-red">
                  CONFLITO
                </span>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold">
                {r.vehicle_brand} {r.vehicle_model} — {r.vehicle_year}
              </div>
              <div className="mt-1 text-[11px] text-ohc-steel">
                {[
                  r.vehicle_version,
                  r.vehicle_generation,
                  r.vehicle_chassis_platform || r.generation_chassis,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Sem geração/versão informada"}
              </div>
            </div>
            <div className="text-xs text-ohc-steel">
              {fmtDate(r.created_at)}
            </div>
            <div>
              <StatusBadge status={r.status} />
            </div>
            <div className="text-xs font-bold text-ohc-glow lg:text-right">
              Analisar →
            </div>
          </button>
        ))}
      </div>
      {!rows.length && (
        <div className="p-10 text-center text-sm text-ohc-steel">
          Nenhuma consulta encontrada com esses filtros.
        </div>
      )}
    </section>
  );
}

function RuleCard({
  rule,
  onDeactivate,
}: {
  rule: Rule;
  onDeactivate?: (rule: Rule) => void;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${rule.active ? "border-ohc-line bg-[#0D1016]" : "border-ohc-line/50 bg-ohc-bg opacity-60"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.14em] text-ohc-glow">
            {rule.product_sku}
          </div>
          <h4 className="mt-1 font-body text-sm font-bold">
            {rule.product_name || "Produto OHC Motors"}
          </h4>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${rule.active ? "border-[#43C981]/30 text-[#93F1BD]" : "border-ohc-line text-ohc-steel"}`}
        >
          {rule.active ? "Ativa" : "Inativa"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-ohc-steel sm:grid-cols-2">
        <div>
          <b className="text-ohc-text">Resultado:</b> {rule.status}
        </div>
        <div>
          <b className="text-ohc-text">Escopo:</b> {rule.scope}
        </div>
        <div>
          <b className="text-ohc-text">Anos:</b> {rule.year_from}–{rule.year_to}
        </div>
        <div>
          <b className="text-ohc-text">Versão:</b> {rule.vehicle_version || "—"}
        </div>
      </div>
      {rule.installation_conditions && (
        <p className="mt-3 rounded-lg bg-white/2.5 p-3 text-xs leading-relaxed text-ohc-steel">
          <b className="text-ohc-text">Condições:</b>{" "}
          {rule.installation_conditions}
        </p>
      )}
      {rule.active && onDeactivate && (
        <button
          onClick={() => onDeactivate(rule)}
          className="mt-4 text-xs font-bold text-[#FF9FA3] hover:text-white"
        >
          Desativar regra
        </button>
      )}
    </article>
  );
}

function RequestDrawer({
  id,
  data,
  products,
  loading,
  onClose,
  onReload,
}: {
  id: string;
  data: DetailData | null;
  products: Product[];
  loading: boolean;
  onClose: () => void;
  onReload: () => Promise<void>;
}) {
  return (
    <div
      className="fixed inset-0 z-100 bg-black/70 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="absolute inset-y-0 right-0 w-full max-w-[980px] overflow-y-auto border-l border-ohc-line bg-[#090C11] shadow-[-40px_0_100px_rgba(0,0,0,.5)]">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-ohc-line bg-[#090C11]/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-ohc-glow">
              Análise de compatibilidade
            </div>
            <div className="mt-1 font-mono text-xs text-ohc-steel">
              {data?.request?.protocol || id}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg border border-ohc-line text-xl hover:border-white/40"
          >
            ×
          </button>
        </div>
        {loading || !data ? (
          <div className="grid min-h-[60vh] place-items-center">
            <div className="ub-dots">
              <i />
              <i />
              <i />
            </div>
          </div>
        ) : (
          <RequestDetail data={data} products={products} onReload={onReload} />
        )}
      </section>
    </div>
  );
}

function RequestDetail({
  data,
  products,
  onReload,
}: {
  data: DetailData;
  products: Product[];
  onReload: () => Promise<void>;
}) {
  const r = data.request;
  const [status, setStatus] = useState<Status>(
    r.status || "analise_necessaria",
  );
  const initialProducts = useMemo(
    () =>
      products
        .filter((p) => (r.recommended_product_skus || []).includes(p.sku))
        .map((p) => p.id),
    [products, r.recommended_product_skus],
  );
  const [productIds, setProductIds] = useState<number[]>(initialProducts);
  const [productQuery, setProductQuery] = useState("");
  const [publicNotes, setPublicNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState(r.internal_notes || "");
  const [conditions, setConditions] = useState("");
  const [confidence, setConfidence] = useState("confirmed");
  const [scope, setScope] = useState("model_year_range");
  const [yearFrom, setYearFrom] = useState(r.vehicle_year);
  const [yearTo, setYearTo] = useState(r.vehicle_year);
  const [saveRule, setSaveRule] = useState(false);
  const [scopeApproved, setScopeApproved] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [conflictPayload, setConflictPayload] = useState<any>(null);

  const visibleProducts = products
    .filter((p) =>
      [p.sku, p.marca, p.nome_produto]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(productQuery.toLowerCase()),
    )
    .slice(0, 80);
  const broadScope = scope === "generation" || scope === "chassis_platform";
  const toggleProduct = (id: number) =>
    setProductIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const submit = async (replaceConflicts = false) => {
    setSaving(true);
    setError("");
    setNotice("");
    if (!replaceConflicts) setConflictPayload(null);
    const payload = {
      action: "save_decision_v2",
      id: r.id,
      status,
      product_ids: productIds,
      public_notes: publicNotes,
      internal_notes: internalNotes,
      installation_conditions: conditions,
      confidence_level: confidence,
      rule_scope: scope,
      year_from: yearFrom,
      year_to: yearTo,
      save_rule: saveRule,
      replace_conflicts: replaceConflicts,
      scope_explicitly_approved: broadScope ? scopeApproved : false,
      change_reason: changeReason,
    };
    try {
      const result: any = await adminAction(payload);
      const resolved = result?.decision?.resolved_equivalent_requests || 0;
      setNotice(
        saveRule
          ? `Resposta salva e memória atualizada.${resolved ? ` ${resolved} consulta(s) equivalente(s) também foram resolvidas.` : ""}`
          : "Resposta da consulta salva sem criar nova regra.",
      );
      await onReload();
    } catch (e: any) {
      if (e.status === 409 && e.data?.conflict) setConflictPayload(e.data);
      else setError(e.message || "Não foi possível salvar a decisão.");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (rule: Rule) => {
    const reason = window.prompt("Motivo da desativação desta regra:");
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
      await onReload();
    } catch (e: any) {
      setError(e.message || "Não foi possível desativar a regra.");
    }
  };

  return (
    <div className="p-5 sm:p-7">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <section className="admin-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Veículo</p>
              <h2 className="mt-2 font-body text-2xl font-extrabold">
                {r.vehicle_brand} {r.vehicle_model}{" "}
                <span className="font-normal text-ohc-steel">
                  {r.vehicle_year}
                </span>
              </h2>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Versão" value={r.vehicle_version} />
            <Info
              label="Geração"
              value={r.vehicle_generation || r.generation_chassis}
            />
            <Info
              label="Chassi / plataforma"
              value={r.vehicle_chassis_platform}
            />
            <Info label="Motorização" value={r.vehicle_motorization} />
            <Info
              label="Consultas equivalentes"
              value={String(r.query_count || 1)}
            />
            <Info label="Criada em" value={fmtDate(r.created_at)} />
          </dl>
          {r.question && (
            <div className="mt-5 border-t border-ohc-line pt-4">
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-ohc-steel">
                Pergunta / observação
              </div>
              <p className="mt-2 text-sm leading-relaxed">{r.question}</p>
            </div>
          )}
        </section>
        <section className="admin-card p-5">
          <p className="eyebrow">Fotos técnicas</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(data.photos || []).map((photo) => (
              <a
                key={photo.id}
                href={photo.signed_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="aspect-square overflow-hidden rounded-lg border border-ohc-line bg-white/2"
              >
                {photo.signed_url ? (
                  <img
                    src={photo.signed_url}
                    alt={photo.original_name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </a>
            ))}
            {!(data.photos || []).length && (
              <div className="col-span-3 rounded-lg border border-dashed border-ohc-line p-8 text-center text-xs text-ohc-steel">
                Nenhuma foto disponível para esta consulta.
              </div>
            )}
          </div>
          {r.photos_expire_at && (
            <p className="mt-3 text-[10px] text-ohc-steel">
              Expiração automática: {fmtDate(r.photos_expire_at)}
            </p>
          )}
        </section>
      </div>

      {(data.conflicts || []).length > 0 && (
        <div className="mt-5 rounded-xl border border-ohc-red/35 bg-ohc-red/10 p-5">
          <div className="font-body text-sm font-bold text-[#FFB5B8]">
            Conflitos existentes detectados
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#DFA9AB]">
            Existem regras ativas com respostas divergentes para este contexto.
            Compare as regras antes de substituir qualquer uma.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[.92fr_1.08fr]">
        <section className="admin-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Contexto</p>
              <h3 className="mt-1 font-body text-base font-bold">
                Regras relacionadas
              </h3>
            </div>
            <span className="text-xs text-ohc-steel">
              {(data.rules || []).length}
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {(data.rules || []).slice(0, 12).map((rule) => (
              <RuleCard key={rule.id} rule={rule} onDeactivate={deactivate} />
            ))}
            {!(data.rules || []).length && (
              <div className="rounded-lg border border-dashed border-ohc-line p-5 text-xs text-ohc-steel">
                Nenhuma regra relacionada encontrada.
              </div>
            )}
          </div>
          {(data.similar_cases || []).length > 0 && (
            <div className="mt-6 border-t border-ohc-line pt-5">
              <div className="text-[10px] font-bold uppercase tracking-[.14em] text-ohc-steel">
                Casos semelhantes
              </div>
              <div className="mt-3 grid gap-2">
                {(data.similar_cases || []).slice(0, 6).map((c: any) => (
                  <div
                    key={c.id}
                    className="rounded-lg bg-white/2.5 p-3 text-xs"
                  >
                    <div className="flex justify-between gap-3">
                      <b>
                        {c.vehicle_brand} {c.vehicle_model} {c.vehicle_year}
                      </b>
                      <span className="text-ohc-steel">{c.protocol}</span>
                    </div>
                    <div className="mt-1 text-ohc-steel">
                      {STATUS_META[c.status as Status]?.label || c.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="admin-card p-5">
          <p className="eyebrow">Decisão administrativa</p>
          <h3 className="mt-1 font-body text-lg font-bold">
            Responder consulta
          </h3>
          <div className="mt-5 grid gap-4">
            <Field label="Resultado">
              <select
                className="admin-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                <option value="analise_necessaria">Análise necessária</option>
                <option value="compativel">Compatível</option>
                <option value="compativel_com_condicoes">
                  Compatível com condições
                </option>
                <option value="incompativel">Não compatível</option>
              </select>
            </Field>
            {status !== "analise_necessaria" && (
              <Field label="Produtos / SKUs da decisão">
                <input
                  className="admin-input mb-2"
                  placeholder="Buscar SKU ou nome…"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                />
                <div className="max-h-64 overflow-y-auto rounded-lg border border-ohc-line">
                  {visibleProducts.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer gap-3 border-b border-ohc-line p-3 last:border-0 hover:bg-white/2.5"
                    >
                      <input
                        type="checkbox"
                        checked={productIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="mt-1 accent-ohc-glow"
                      />
                      <span className="min-w-0">
                        <b className="block text-xs">
                          {p.nome_produto || p.sku}
                        </b>
                        <span className="mt-0.5 block font-mono text-[10px] text-ohc-steel">
                          {p.sku} · {p.marca}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-ohc-steel">
                  {productIds.length} produto(s) selecionado(s).
                </p>
              </Field>
            )}
            <Field label="Nota pública">
              <textarea
                className="admin-input min-h-24 resize-y"
                value={publicNotes}
                onChange={(e) => setPublicNotes(e.target.value)}
                placeholder="Informação que pode aparecer no resultado ao cliente."
              />
            </Field>
            <Field label="Nota interna">
              <textarea
                className="admin-input min-h-24 resize-y"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Observações somente para a equipe OHC."
              />
            </Field>
            {status === "compativel_com_condicoes" && (
              <Field label="Condições de instalação">
                <textarea
                  className="admin-input min-h-24 resize-y"
                  required
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="Descreva exatamente as adaptações ou condições necessárias."
                />
              </Field>
            )}
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ohc-line bg-white/2 p-4">
              <input
                type="checkbox"
                checked={saveRule}
                onChange={(e) => setSaveRule(e.target.checked)}
                disabled={status === "analise_necessaria"}
                className="mt-1 accent-ohc-glow"
              />
              <span>
                <b className="block text-sm">
                  Salvar resposta e ensinar o sistema
                </b>
                <span className="mt-1 block text-xs leading-relaxed text-ohc-steel">
                  Cria ou atualiza a memória de compatibilidade para reutilizar
                  esta decisão em consultas equivalentes.
                </span>
              </span>
            </label>

            {saveRule && status !== "analise_necessaria" && (
              <div className="grid gap-4 rounded-xl border border-ohc-blue/25 bg-ohc-blue/6 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Escopo da regra">
                    <select
                      className="admin-input"
                      value={scope}
                      onChange={(e) => {
                        setScope(e.target.value);
                        setScopeApproved(false);
                      }}
                    >
                      {SCOPES.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Confiança">
                    <select
                      className="admin-input"
                      value={confidence}
                      onChange={(e) => setConfidence(e.target.value)}
                    >
                      <option value="confirmed">Confirmada</option>
                      <option value="high">Alta</option>
                      <option value="medium">Média</option>
                      <option value="low">Baixa</option>
                    </select>
                  </Field>
                </div>
                {scope !== "exact_vehicle_version" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Ano inicial">
                      <input
                        type="number"
                        className="admin-input"
                        value={yearFrom}
                        min={1950}
                        max={2100}
                        onChange={(e) => setYearFrom(Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Ano final">
                      <input
                        type="number"
                        className="admin-input"
                        value={yearTo}
                        min={1950}
                        max={2100}
                        onChange={(e) => setYearTo(Number(e.target.value))}
                      />
                    </Field>
                  </div>
                )}
                {broadScope && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#D6A545]/30 bg-[#D6A545]/6 p-3">
                    <input
                      type="checkbox"
                      checked={scopeApproved}
                      onChange={(e) => setScopeApproved(e.target.checked)}
                      className="mt-1 accent-[#D6A545]"
                    />
                    <span className="text-xs leading-relaxed text-[#E8C77E]">
                      <b className="block text-ohc-text">
                        Confirmação explícita obrigatória
                      </b>
                      Eu revisei e aprovo que esta resposta valha para toda a{" "}
                      {scope === "generation" ? "geração" : "plataforma/chassi"}{" "}
                      indicada.
                    </span>
                  </label>
                )}
                <Field label="Motivo / registro da alteração">
                  <textarea
                    className="admin-input min-h-20 resize-y"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="Ex.: confirmação física feita pela equipe em veículo do cliente."
                  />
                </Field>
              </div>
            )}

            {conflictPayload && (
              <div className="rounded-xl border border-ohc-red/40 bg-ohc-red/10 p-4">
                <b className="text-sm text-[#FFC0C2]">
                  A gravação foi bloqueada por conflito.
                </b>
                <p className="mt-2 text-xs leading-relaxed text-[#DFA9AB]">
                  O banco encontrou{" "}
                  {conflictPayload.conflict_count ||
                    conflictPayload.conflicts?.length ||
                    "uma ou mais"}{" "}
                  regra(s) incompatível(is) com a nova decisão. Nada foi
                  substituído automaticamente.
                </p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => submit(true)}
                  className="mt-4 rounded-lg border border-ohc-red/50 px-4 py-2 text-xs font-bold text-[#FFB5B8] hover:bg-ohc-red/15"
                >
                  Confirmar correção e substituir conflitos
                </button>
              </div>
            )}
            {notice && (
              <div className="rounded-lg border border-[#43C981]/30 bg-[#43C981]/10 p-3 text-xs leading-relaxed text-[#A9EFC7]">
                {notice}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-ohc-red/35 bg-ohc-red/10 p-3 text-xs leading-relaxed text-[#FFD0D2]">
                {error}
              </div>
            )}
            <button
              type="button"
              disabled={saving || (broadScope && saveRule && !scopeApproved)}
              onClick={() => submit(false)}
              className="btn btn-blue w-full disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving
                ? "Salvando…"
                : saveRule
                  ? "Salvar resposta e ensinar o sistema"
                  : "Salvar resposta"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[.12em] text-ohc-steel">
        {label}
      </dt>
      <dd className="mt-1 font-semibold">{value || "—"}</dd>
    </div>
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
