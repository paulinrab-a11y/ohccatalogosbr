import { useMemo, useState } from "react";
import Nav from "../components/Nav";
import AmbientLighting from "../components/AmbientLighting";
import Footer, { FloatingWA } from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useRoute } from "../lib/router";
import { CATS, useProducts, brands, matches } from "../lib/products";
export default function Catalogo() {
  const products = useProducts();
  const { route } = useRoute();
  const [cat, setCat] = useState(route.search.get("categoria") || "");
  const [brand, setBrand] = useState(route.search.get("marca") || "");
  const [q, setQ] = useState(route.search.get("q") || "");
  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (!cat || p.category === cat) &&
          (!brand || p.brand === brand) &&
          matches(p, q),
      ),
    [products, cat, brand, q],
  );
  const groups = useMemo(() => {
    const g: Record<string, typeof list> = {};
    list.forEach((p) => (g[p.brand] ||= []).push(p));
    return g;
  }, [list]);
  const Opt = ({
    on,
    label,
    n,
    onClick,
  }: {
    on: boolean;
    label: string;
    n: number;
    onClick: () => void;
  }) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm min-h-[40px] ${on ? "bg-ohc-blue text-white" : "border border-ohc-line md:border-0 hover:bg-ohc-bg2"}`}
    >
      {label}
      <span className="text-xs opacity-70">{n}</span>
    </button>
  );
  return (
    <>
      <AmbientLighting />
      <Nav />
      <div className="wrap grid gap-8 py-10 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] md:gap-10 md:py-14">
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="ub-field">
            <label htmlFor="q">Buscar</label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Modelo, SKU ou veículo"
            />
          </div>
          <h4 className="mt-6 mb-2 text-xs font-bold text-ohc-steel">
            Categoria
          </h4>
          <div className="flex flex-wrap gap-1.5 md:grid">
            <Opt
              on={!cat}
              label="Todas"
              n={products.length}
              onClick={() => setCat("")}
            />
            {CATS.map((c) => (
              <Opt
                key={c}
                on={cat === c}
                label={c}
                n={products.filter((p) => p.category === c).length}
                onClick={() => setCat(c)}
              />
            ))}
          </div>
          <h4 className="mt-6 mb-2 text-xs font-bold text-ohc-steel">Marca</h4>
          <div className="flex flex-wrap gap-1.5 md:grid">
            <Opt
              on={!brand}
              label="Todas"
              n={products.length}
              onClick={() => setBrand("")}
            />
            {brands(products).map((b) => (
              <Opt
                key={b}
                on={brand === b}
                label={b}
                n={products.filter((p) => p.brand === b).length}
                onClick={() => setBrand(b)}
              />
            ))}
          </div>
        </aside>
        <main className="min-w-0">
          <h1 className="text-[clamp(44px,7vw,72px)]">Catálogo</h1>
          <p className="mb-6 text-sm text-ohc-steel">
            Mostrando <b className="text-ohc-text">{list.length}</b>{" "}
            {list.length === 1 ? "produto" : "produtos"} em{" "}
            <b className="text-ohc-text">
              {[cat, brand].filter(Boolean).join(" · ") || "todo o catálogo"}
            </b>
          </p>
          {!list.length && (
            <div className="rounded-lg border border-dashed border-ohc-line p-6 sm:p-10 text-center text-ohc-steel">
              Nenhum produto com esses filtros. Limpe a busca ou pergunte à
              equipe no WhatsApp.
            </div>
          )}
          {Object.keys(groups)
            .sort()
            .map((b) => (
              <section key={b} className="mb-10">
                <h2 className="mb-4 flex items-baseline gap-3 text-[34px]">
                  {b}
                  <span className="font-body text-xs font-semibold text-ohc-steel">
                    {groups[b].length}
                  </span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groups[b].map((p) => (
                    <ProductCard key={p.sku} p={p} />
                  ))}
                </div>
              </section>
            ))}
        </main>
      </div>
      <Footer />
      <FloatingWA />
    </>
  );
}
