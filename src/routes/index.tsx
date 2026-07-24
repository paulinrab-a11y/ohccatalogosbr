import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import produtosData from "@/data/produtos.json";

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
      { title: "OHC Motors — Catálogo de Volantes, Faróis e Acessórios Automotivos" },
      {
        name: "description",
        content:
          "Catálogo oficial OHC Motors: volantes esportivos, faróis, lanternas e acessórios para Audi, BMW, Mercedes-Benz, Porsche, Volkswagen e mais. Fale conosco pelo WhatsApp.",
      },
      { property: "og:title", content: "OHC Motors — Catálogo Master" },
      {
        property: "og:description",
        content: "Volantes, faróis, lanternas e acessórios premium para carros esportivos e de luxo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Catalog,
});

function whatsappLink(p: Produto) {
  const msg = `Olá! Tenho interesse no produto:\n\n${p.marca} — ${p.modelo}\nSKU: ${p.sku}\nCategoria: ${p.categoria}`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function Catalog() {
  const marcas = useMemo(() => ["Todas", ...Array.from(new Set(produtos.map((p) => p.marca))).sort()], []);
  const categorias = useMemo(() => ["Todas", ...Array.from(new Set(produtos.map((p) => p.categoria)))], []);

  const [marca, setMarca] = useState("Todas");
  const [categoria, setCategoria] = useState("Todas");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Produto | null>(null);

  const filtered = produtos.filter((p) => {
    if (marca !== "Todas" && p.marca !== marca) return false;
    if (categoria !== "Todas" && p.categoria !== categoria) return false;
    if (q) {
      const hay = `${p.marca} ${p.modelo} ${p.sku} ${p.material} ${p.tipo}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary font-black text-primary-foreground">
              O
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">OHC MOTORS</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Catálogo Master
              </div>
            </div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener"
            className="hidden items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
            (11) 95579-8211
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(0.65 0.24 25 / 0.35), transparent 50%), radial-gradient(circle at 80% 60%, oklch(0.72 0.18 55 / 0.25), transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Performance • Estilo • Precisão
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Volantes, faróis e acessórios para quem exige o melhor.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Explore o catálogo completo da OHC Motors — {produtos.length} produtos com aplicação
            verificada por SKU para Audi, BMW, Mercedes-Benz, Porsche, Volkswagen e outras marcas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#catalogo"
              className="inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Ver catálogo
            </a>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-muted"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section id="catalogo" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Catálogo</h2>
              <p className="text-sm text-muted-foreground">
                {filtered.length} de {produtos.length} produtos
              </p>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por marca, modelo ou SKU..."
              className="w-full max-w-sm rounded-md border border-border bg-input px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <FilterRow label="Categoria" options={categorias} value={categoria} onChange={setCategoria} />
          <FilterRow label="Marca" options={marcas} value={marca} onChange={setMarca} />
        </div>

        {/* Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.sku} p={p} onOpen={() => setSelected(p)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
              Nenhum produto encontrado com esses filtros.
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <div className="text-sm font-black tracking-widest">OHC MOTORS</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Catálogo master · {produtos.length} produtos · Confirmar aplicação pelo SKU.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <WhatsAppIcon className="h-4 w-4" />
            +55 11 95579-8211
          </a>
        </div>
      </footer>

      {selected && <ProductModal p={selected} onClose={() => setSelected(null)} />}
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
      <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-secondary-foreground hover:border-primary/60"
            }`}
          >
            {opt}
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
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition hover:border-primary/60 hover:shadow-[0_0_0_1px_var(--color-primary)]"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {img ? (
          <img
            src={`/${img}`}
            alt={`${p.marca} ${p.modelo}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-sm bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
          {p.categoria}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-accent">
          {p.marca}
        </div>
        <div className="line-clamp-2 text-sm font-bold leading-snug">{p.modelo}</div>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span className="font-mono">{p.sku}</span>
          <span className="text-primary">Ver detalhes →</span>
        </div>
      </div>
    </button>
  );
}

function ProductModal({ p, onClose }: { p: Produto; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
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
              <div key={i} className="overflow-hidden rounded-md border border-border bg-secondary">
                <img src={`/${img}`} alt={`${p.modelo} ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-accent">
                {p.marca} · {p.categoria}
              </div>
              <h3 className="mt-1 text-2xl font-black leading-tight">{p.modelo}</h3>
              <div className="mt-1 font-mono text-xs text-muted-foreground">SKU: {p.sku}</div>
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
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
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
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.52 3.48A11.94 11.94 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.83 11.83 0 0 0 5.64 1.44h.01c6.53 0 11.83-5.3 11.83-11.83 0-3.16-1.23-6.13-3.36-8.45zM12.05 21.4h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.79 1 1.01-3.7-.24-.38a9.86 9.86 0 0 1-1.51-5.24c0-5.44 4.43-9.87 9.87-9.87 2.63 0 5.11 1.03 6.97 2.89a9.79 9.79 0 0 1 2.89 6.99c0 5.44-4.43 9.9-9.79 9.9zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.19-.24-.57-.48-.5-.66-.5l-.56-.01c-.2 0-.51.07-.78.37-.27.3-1.02 1-1.02 2.43 0 1.44 1.05 2.83 1.2 3.02.15.2 2.07 3.17 5.02 4.44.7.3 1.25.48 1.68.62.7.22 1.35.19 1.86.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}
