import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import produtosData from "@/data/produtos.json";
import logoAsset from "@/assets/ohc-logo.webp.asset.json";

type Produto = {
  marca: string;
  modelo: string;
  material: string;
  cor: string;
  recursos: string[];
  sku: string;
  imagens: string[];
  categoria: string;
  tipo: string;
  compatibilidade: string;
  descricao: string;
  sku_aliases?: string[];
};

const produtos = produtosData as Produto[];
const WHATSAPP = "5511955798211";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OHC Motors — Catálogo Completo de Volantes, Faróis e Acessórios" },
      {
        name: "description",
        content:
          "Catálogo oficial OHC Motors: volantes esportivos, faróis, lanternas e acessórios para Audi, BMW, Mercedes-Benz, Porsche, Volkswagen e mais. Atendimento pelo WhatsApp.",
      },
      { property: "og:title", content: "OHC Motors — Catálogo Master" },
      {
        property: "og:description",
        content: "Volantes, faróis, lanternas e acessórios premium para carros esportivos e de luxo.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ohccatalogosbr.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "OHC Motors — Catálogo Master" },
      { name: "twitter:description", content: "Volantes, faróis, lanternas e acessórios premium para carros esportivos e de luxo." },
    ],
    links: [{ rel: "canonical", href: "https://ohccatalogosbr.lovable.app/" }],
  }),
  component: Catalog,
});

function whatsappLink(p?: Produto) {
  if (!p) return `https://wa.me/${WHATSAPP}`;
  const msg = `Olá! Tenho interesse no produto:\n\n${p.marca} — ${p.modelo}\nSKU: ${p.sku}\nCategoria: ${p.categoria}`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

const CATEGORIAS = ["Volantes", "Faróis & Lanternas", "Acessórios"] as const;

function Catalog() {
  const marcas = useMemo(
    () => ["Todas", ...Array.from(new Set(produtos.map((p) => p.marca))).sort((a, b) => a.localeCompare(b, "pt-BR"))],
    [],
  );

  const [marca, setMarca] = useState("Todas");
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("Volantes");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Produto | null>(null);

  const filtered = produtos
    .filter((p) => {
      if (p.categoria !== categoria) return false;
      if (marca !== "Todas" && p.marca !== marca) return false;
      if (q) {
        const hay = `${p.marca} ${p.modelo} ${p.sku} ${p.material} ${p.tipo}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => a.marca.localeCompare(b.marca, "pt-BR") || a.modelo.localeCompare(b.modelo, "pt-BR"));

  const grouped = useMemo(() => {
    const map = new Map<string, Produto[]>();
    for (const p of filtered) {
      if (!map.has(p.marca)) map.set(p.marca, []);
      map.get(p.marca)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top brand bar (tricolor) */}
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-accent" />
        <div className="flex-1 bg-background" />
        <div className="flex-1 bg-primary" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <img src={logoAsset.url} alt="OHC Motors" className="h-9 w-auto sm:h-10" />
          </a>
          <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground md:flex">
            <a href="#catalogo" className="transition hover:text-foreground">Performance</a>
            <span className="text-border">·</span>
            <a href="#catalogo" className="transition hover:text-foreground">Iluminação</a>
            <span className="text-border">·</span>
            <a href="#catalogo" className="transition hover:text-foreground">Acessórios</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-bold uppercase tracking-wider text-secondary-foreground transition hover:border-accent hover:text-accent sm:px-4 sm:text-sm"
              title="Imprimir catálogo"
            >
              <PrinterIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 sm:px-4 sm:text-sm"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Falar no WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="no-print relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 25%, oklch(0.47 0.17 265 / 0.55), transparent 55%), radial-gradient(circle at 90% 80%, oklch(0.58 0.24 27 / 0.25), transparent 50%), linear-gradient(180deg, oklch(0.17 0.03 265) 0%, oklch(0.12 0.02 260) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute -right-32 top-1/2 hidden aspect-square w-[420px] -translate-y-1/2 rounded-full border border-foreground/10 md:block"
        />
        <div
          className="pointer-events-none absolute -right-16 top-1/2 hidden aspect-square w-[260px] -translate-y-1/2 rounded-full border border-foreground/10 md:block"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          {/* Tricolor accent bar */}
          <div className="mb-6 flex h-1 w-24 overflow-hidden">
            <div className="flex-1 bg-accent" />
            <div className="flex-1 bg-foreground" />
            <div className="flex-1 bg-primary" />
          </div>

          <h1 className="font-display text-5xl leading-[0.9] tracking-wide text-foreground sm:text-7xl lg:text-8xl">
            CATÁLOGO <span className="text-primary">COMPLETO</span>
            <br />
            OHC MOTORS
          </h1>
          <p className="mt-6 max-w-2xl text-sm text-muted-foreground sm:text-base">
            A versão mais completa do catálogo OHC Motors: volantes, variações da base de produtos,
            faróis, lanternas e acessórios reunidos em um único site.
          </p>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-6">
            <Stat number={produtos.length} label="Produtos cadastrados" color="text-foreground" />
            <Stat
              number={new Set(produtos.map((p) => p.categoria)).size}
              label="Categorias"
              color="text-primary"
            />
            <Stat
              number={new Set(produtos.map((p) => p.marca)).size}
              label="Marcas atendidas"
              color="text-accent"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section id="catalogo" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por produto, veículo, tecnologia ou SKU..."
              className="w-full rounded-md border border-border bg-input py-3 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-accent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              Categoria
            </span>
            {CATEGORIAS.map((c) => {
              const active = c === categoria;
              return (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground hover:border-accent/60"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <FilterRow label="Marca" options={marcas} value={marca} onChange={setMarca} />

          <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <div>
              Mostrando <span className="font-bold text-foreground">{filtered.length}</span> produtos em{" "}
              <span className="font-bold text-foreground">{categoria}</span>
            </div>
            <div className="hidden sm:block">
              {marca === "Todas" ? "Todas as marcas" : marca}
            </div>
          </div>
        </div>

        {/* Grid grouped by brand */}
        <div className="mt-8 flex flex-col gap-10 pb-16 print-grid">
          {grouped.map(([brandName, items]) => (
            <div key={brandName}>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <h2 className="font-display text-2xl tracking-wider text-foreground">
                  {brandName}
                </h2>
                <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {items.length}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.sku} p={p} onOpen={() => setSelected(p)} />
                ))}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
              Nenhum produto encontrado com esses filtros.
            </div>
          )}
        </div>
      </section>


      <footer className="border-t border-border bg-card">
        <div className="flex h-1 w-full">
          <div className="flex-1 bg-accent" />
          <div className="flex-1 bg-foreground" />
          <div className="flex-1 bg-primary" />
        </div>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="OHC Motors" className="h-9 w-auto" />
            <div className="text-xs text-muted-foreground">
              Catálogo master · {produtos.length} produtos
              <br />
              Confirmar aplicação pelo SKU.
            </div>
          </div>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <WhatsAppIcon className="h-4 w-4 text-primary" />
            +55 11 95579-8211
          </a>
        </div>
      </footer>

      {selected && <ProductModal p={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Stat({ number, label, color }: { number: number; label: string; color: string }) {
  return (
    <div>
      <div className={`font-display text-5xl leading-none ${color}`}>{number}</div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      {options.map((opt) => {
        const active = opt === value;
        const isAll = opt === "Todas";
        const label = isAll ? "Todos" : opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`rounded-md border px-3 py-1.5 text-xs font-bold transition ${
              active
                ? isAll
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-accent bg-accent text-accent-foreground"
                : "border-border bg-secondary text-secondary-foreground hover:border-accent/60"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ProductCard({ p, onOpen }: { p: Produto; onOpen: () => void }) {
  const img = p.imagens[0];
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_10px_40px_-15px_oklch(0.47_0.17_265/0.5)]"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        {img ? (
          <img
            src={`/${img}`}
            alt={`${p.marca} ${p.modelo}`}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-sm bg-background/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground backdrop-blur">
          {p.categoria}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          {p.marca}
        </div>
        <div className="line-clamp-2 text-sm font-bold leading-snug">{p.modelo}</div>
        <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
          <span className="font-mono">{p.sku || "SKU não informado"}</span>
          <span className="font-bold text-primary">Ver detalhes →</span>
        </div>
      </div>
    </button>
  );
}

function ProductModal({ p, onClose }: { p: Produto; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-md border border-border bg-background/80 px-2 py-1 text-xs text-foreground backdrop-blur hover:bg-muted"
        >
          Fechar ✕
        </button>
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            {p.imagens.map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-md border border-border bg-white">
                <img src={`/${img}`} alt={`${p.modelo} ${i + 1}`} className="h-full w-full object-contain p-4" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
                {p.marca} · {p.categoria}
              </div>
              <h3 className="mt-2 font-display text-3xl leading-tight tracking-wide">{p.modelo}</h3>
              <div className="mt-1 font-mono text-xs text-muted-foreground">SKU: {p.sku || "não informado"}</div>
            </div>

            <p className="text-sm text-muted-foreground">{p.descricao}</p>

            <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-background/40 p-3 text-sm">
              <Info label="Tipo" value={p.tipo} />
              <Info label="Material" value={p.material} />
              <Info label="Cor" value={p.cor} />
              <Info label="Compatibilidade" value={p.compatibilidade} />
            </dl>

            {p.recursos?.length > 0 && (
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Recursos
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.recursos.map((r) => (
                    <span
                      key={r}
                      className="rounded-full border border-border bg-secondary px-3 py-1 text-xs"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <a
              href={whatsappLink(p)}
              target="_blank"
              rel="noopener"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Consultar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M6 9V2h12v7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.52 3.48A11.94 11.94 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.83 11.83 0 0 0 5.64 1.44h.01c6.53 0 11.83-5.3 11.83-11.83 0-3.16-1.23-6.13-3.36-8.45zM12.05 21.4h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.79 1 1.01-3.7-.24-.38a9.86 9.86 0 0 1-1.51-5.24c0-5.44 4.43-9.87 9.87-9.87 2.63 0 5.11 1.03 6.97 2.89a9.79 9.79 0 0 1 2.89 6.99c0 5.44-4.43 9.9-9.79 9.9zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.19-.24-.57-.48-.5-.66-.5l-.56-.01c-.2 0-.51.07-.78.37-.27.3-1.02 1-1.02 2.43 0 1.44 1.05 2.83 1.2 3.02.15.2 2.07 3.17 5.02 4.44.7.3 1.25.48 1.68.62.7.22 1.35.19 1.86.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}
