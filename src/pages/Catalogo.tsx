import { useEffect, useMemo, useRef, useState } from "react";
import Nav from "../components/Nav";
import Footer, { FloatingWA } from "../components/Footer";
import ProductCard from "../components/ProductCard";
import LiveryTitle from "../components/LiveryTitle";
import { useRoute } from "../lib/router";
import { carComplete, carLabel, useMyCar } from "../lib/myCar";
import { fitOf, fitSentence, useFit } from "../lib/fit";
import CarFit from "../components/CarFit";
import {
  CATS,
  byCategoryThenName,
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
  // The visitor's car: once brand, model and year are known, every card says
  // whether it fits, and the list can show only what fits.
  const car = useMyCar();
  const { fit, loading: fitLoading } = useFit(car);
  const [onlyFit, setOnlyFit] = useState(false);
  const carKey = carComplete(car) ? carLabel(car) : "";
  const firstCar = useRef(true);
  useEffect(() => {
    // A car named here (not the one remembered from before) jumps to its brand.
    if (firstCar.current) {
      firstCar.current = false;
      return;
    }
    if (carKey && car) {
      setBrand(resolveBrand(car.brand, products) || car.brand);
      setQ("");
      setOnlyFit(true);
    }
  }, [carKey]);
  const fits = (sku: string) => {
    const status = fitOf(fit, sku).status;
    return status === "serve" || status === "condicoes";
  };
  const fitCount = fit ? products.filter((p) => fits(p.sku)).length : 0;
  // Nothing confirmed for the car: show the whole catalog, never an empty page.
  const filterFit = onlyFit && fitCount > 0;
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
          matches(p, q) &&
          (!filterFit || fits(p.sku)),
      ),
    [products, cat, brand, q, filterFit, fit],
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
    for (const items of Object.values(g)) items.sort(byCategoryThenName);
    return g;
  }, [list]);
  return (
    <>
      <Nav />
      <LiveryTitle
        lines={["Catálogo", brand || cat || "Todas as marcas"]}
        className="-mb-[3vw]"
        titleClass="text-[clamp(48px,11vw,84px)]"
      />
      <header className="wrap">
        <section
          aria-labelledby="meu-carro"
          className="decal mt-3 grid gap-3 p-4 sm:p-5"
        >
          <h2
            id="meu-carro"
            className="font-display text-[26px] leading-none tracking-wide"
          >
            Serve no meu carro?
          </h2>
          <CarFit car={car} fit={fit} loading={fitLoading} />
          {fit && (
            <div className="flex flex-wrap items-center gap-3">
              {fitCount > 0 && (
                <button
                  type="button"
                  aria-pressed={onlyFit}
                  onClick={() => setOnlyFit((v) => !v)}
                  className="chip"
                >
                  Só o que serve no meu carro
                  <small>{fitCount}</small>
                </button>
              )}
              {fitCount === 0 && (
                <p className="text-sm text-[#c9d0d8]">
                  A base do site ainda não tem volante confirmado para esse
                  carro. A equipe confirma pelo WhatsApp com fotos do volante
                  atual.
                </p>
              )}
            </div>
          )}
        </section>
      </header>
      <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-6 py-6 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] md:gap-10 md:py-10">
        <aside className="facets min-w-0 md:sticky md:top-24 md:max-h-[calc(100svh-7rem)] md:self-start md:overflow-y-auto md:pr-1">
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
          <div className="chip-row md:grid md:gap-0.5">
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
          <div className="chip-row md:grid md:gap-0.5">
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
          {/* While the catalog loads, card-shaped placeholders hold the space
              so the footer does not jump when the products arrive. */}
          {loading && !list.length && (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-hidden="true"
              data-testid="catalog-skeleton"
            >
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="decal">
                  <div className="aspect-square bg-[#0e1116]" />
                  <div className="grid gap-2 p-3.5 sm:p-4">
                    <div className="h-4 w-4/5 rounded-sm bg-[#1b2029]" />
                    <div className="h-3 w-1/2 rounded-sm bg-[#1b2029]" />
                    <div className="mt-6 h-6 w-3/5 rounded-sm bg-[#1b2029]" />
                  </div>
                  <div className="min-h-11 border-t border-ohc-line" />
                </div>
              ))}
            </div>
          )}
          {loading && !list.length && (
            <p className="sr-only" role="status">
              Carregando catálogo…
            </p>
          )}
          {!loading && !list.length && (
            <div className="decal p-6 text-[#c9d0d8] sm:p-10">
              Nenhum produto com esses filtros. Limpe a busca ou pergunte à
              equipe no WhatsApp.
            </div>
          )}
          {sorted && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sorted.map((p) => (
                <ProductCard
                  key={p.sku}
                  p={p}
                  fit={fit ? fitOf(fit, p.sku) : undefined}
                  carLine={fitSentence(car, fit, p.sku)}
                />
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
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groups[b].map((p) => (
                      <ProductCard
                        key={p.sku}
                        p={p}
                        fit={fit ? fitOf(fit, p.sku) : undefined}
                        carLine={fitSentence(car, fit, p.sku)}
                      />
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
