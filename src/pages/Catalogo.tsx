import { useEffect, useMemo, useState } from "react";
import Nav from "../components/Nav";
import Footer, { FloatingWA } from "../components/Footer";
import ProductCard from "../components/ProductCard";
import LiveryTitle from "../components/LiveryTitle";
import { useRoute } from "../lib/router";
import { carLabel, readCar, type MyCar } from "../lib/myCar";
import {
  CATS,
  useCatalog,
  brands,
  matches,
  resolveBrand,
  resolveCategory,
} from "../lib/products";
import { getPrecoVigente } from "../lib/pricing";
import { applySeo, catalogHead } from "../lib/seo";
function Opt({
  on,
  label,
  n,
  onClick,
}: {
  on: boolean;
  label: string;
  n: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="chip md:justify-between"
    >
      {label}
      <small>{n}</small>
    </button>
  );
}
export default function Catalogo() {
  const { products, loading } = useCatalog();
  const { route } = useRoute();
  // Ad links may say categoria=volantes&marca=bmw; both resolve to the
  // catalog's own names. The brand list arrives with the catalog.
  const [cat, setCat] = useState(() =>
    resolveCategory(route.search.get("categoria")),
  );
  const [brand, setBrand] = useState(route.search.get("marca") || "");
  useEffect(() => {
    if (products.length && brand) setBrand(resolveBrand(brand, products));
  }, [products]);
  const [q, setQ] = useState(route.search.get("q") || "");
  const [order, setOrder] = useState(() => {
    const o = route.search.get("ordem");
    return o === "preco-asc" || o === "preco-desc" ? o : "";
  });
  // The car saved on the home page; offered here when no filter is set.
  const [car, setCar] = useState<MyCar | null>(null);
  useEffect(() => setCar(readCar()), []);
  const carActive = car && brand === car.brand && q === car.model;
  // Filters live in the URL so reload, back and shared links keep them.
  // replaceState avoids a history entry (and a remount) per click or keystroke.
  useEffect(() => {
    const params = new URLSearchParams();
    if (cat) params.set("categoria", cat);
    if (brand) params.set("marca", brand);
    if (q.trim()) params.set("q", q.trim());
    if (order) params.set("ordem", order);
    const query = params.toString();
    const next = `/catalogo${query ? `?${query}` : ""}${location.hash}`;
    if (next !== location.pathname + location.search + location.hash)
      history.replaceState(history.state, "", next);
  }, [cat, brand, q, order]);
  useEffect(() => {
    const filters = new URLSearchParams();
    if (cat) filters.set("categoria", cat);
    if (brand) filters.set("marca", brand);
    applySeo(catalogHead(filters, products));
  }, [cat, brand, products]);
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
  // Sorted by the price charged now; products without a price go last.
  const sorted = useMemo(() => {
    if (!order) return null;
    const price = (p: (typeof list)[number]) => getPrecoVigente(p).preco;
    return [...list].sort((a, b) => {
      const pa = price(a);
      const pb = price(b);
      if (pa == null) return pb == null ? 0 : 1;
      if (pb == null) return -1;
      return order === "preco-asc" ? pa - pb : pb - pa;
    });
  }, [list, order]);
  const groups = useMemo(() => {
    const g: Record<string, typeof list> = {};
    list.forEach((p) => (g[p.brand] ||= []).push(p));
    return g;
  }, [list]);
  return (
    <>
      <Nav />
      <LiveryTitle
        lines={["Catálogo", brand || cat || "Todas as marcas"]}
        className="-mb-[3vw]"
        titleClass="text-[clamp(52px,12vw,104px)]"
      />
      <header className="wrap">
        {car && !carActive && (
          <button
            type="button"
            onClick={() => {
              setBrand(car.brand);
              setQ(car.model);
            }}
            className="decal mt-3 flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm sm:w-auto"
          >
            <span>
              Seu carro: <b>{carLabel(car)}</b>
            </span>
            <span className="font-bold text-[#afc8ff]">Mostrar</span>
          </button>
        )}
      </header>
      <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-6 py-6 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] md:gap-10 md:py-10">
        <aside className="min-w-0 md:sticky md:top-24 md:self-start">
          <div className="ub-field">
            <label htmlFor="q">Buscar</label>
            <input
              id="q"
              name="q"
              type="search"
              autoComplete="off"
              spellCheck={false}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Modelo, SKU ou veículo…"
            />
          </div>
          <h2 className="mt-6 mb-2 font-body text-xs font-bold text-[#c9d0d8]">
            Categoria
          </h2>
          <div className="chip-row md:grid md:gap-1.5">
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
          <h2 className="mt-5 mb-2 font-body text-xs font-bold text-[#c9d0d8]">
            Marca
          </h2>
          <div className="chip-row md:grid md:gap-1.5">
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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#c9d0d8]" aria-live="polite">
              Mostrando <b className="text-ohc-text">{list.length}</b>{" "}
              {list.length === 1 ? "produto" : "produtos"} em{" "}
              <b className="text-ohc-text">
                {[cat, brand].filter(Boolean).join(" · ") || "todo o catálogo"}
              </b>
            </p>
            <div className="ub-field min-w-[190px]">
              <label htmlFor="ordem" className="sr-only">
                Ordenar
              </label>
              <select
                id="ordem"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              >
                <option value="">Ordenar por marca</option>
                <option value="preco-asc">Menor preço</option>
                <option value="preco-desc">Maior preço</option>
              </select>
            </div>
          </div>
          {!list.length && (
            <div className="decal p-6 text-[#c9d0d8] sm:p-10">
              {loading
                ? "Carregando catálogo…"
                : "Nenhum produto com esses filtros. Limpe a busca ou pergunte à equipe no WhatsApp."}
            </div>
          )}
          {sorted && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sorted.map((p) => (
                <ProductCard key={p.sku} p={p} />
              ))}
            </div>
          )}
          {!sorted &&
            Object.keys(groups)
              .sort()
              .map((b) => (
                <section key={b} className="mb-10">
                  <h2 className="mb-4 flex flex-wrap items-baseline gap-x-3 border-b border-ohc-line pb-2 text-[clamp(32px,9vw,40px)] [overflow-wrap:anywhere]">
                    {b}
                    <span className="data-band">{groups[b].length}</span>
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
