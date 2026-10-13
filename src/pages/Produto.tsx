import { useEffect, useRef, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import LiveryTitle from "../components/LiveryTitle";
import FitmentPlate from "../components/FitmentPlate";
import PriceBlock, { DiscountBadge } from "../components/PriceBlock";
import { Link, useRoute } from "../lib/router";
import {
  embeddedProduct,
  useCatalog,
  small,
  waLink,
  type Product,
} from "../lib/products";
import { getPrecoVigente } from "../lib/pricing";
import { productMessage } from "../lib/attribution";
import { productParams, track } from "../lib/pixel";
import { applySeo, productDescription, productHead } from "../lib/seo";
// Singular label for the livery header ("Volante" / "BMW").
const KIND: Record<string, string> = {
  Volantes: "Volante",
  Grades: "Grade",
  "Faróis & Lanternas": "Farol e lanterna",
  Acessórios: "Acessório",
};
function productSlug(path: string) {
  if (!path.startsWith("/produto/")) return "";
  try {
    return decodeURIComponent(path.slice("/produto/".length));
  } catch {
    return "";
  }
}

function WhatsAppIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c-.1-.1-.2-.2-.5-.3z" />
    </svg>
  );
}

/** The one action that matters on this page; the sticky copy reuses it. */
function BuyLink({ p, className }: { p: Product; className: string }) {
  const price = getPrecoVigente(p).preco;
  return (
    <a
      className={className}
      href={waLink(productMessage(p, price))}
      onClick={() => track("Contact", productParams(p.sku, price))}
      target="_blank"
      rel="noopener"
    >
      <WhatsAppIcon />
      Comprar pelo WhatsApp
    </a>
  );
}

const TRUST = [
  "Fabricação própria OHC Motors",
  "Garantia de 90 dias contra defeito",
  "Envio para todo o Brasil",
];

export default function Produto() {
  const { products, loading } = useCatalog();
  const { route } = useRoute();
  const slug = productSlug(route.path);
  const live = products.find(
    (x) => x.slug === slug || x.sku === route.search.get("sku"),
  );
  // While the catalog loads, the build-time page data shows the product at
  // once; the price arrives with the catalog.
  const p = live || (loading ? embeddedProduct(slug) || undefined : undefined);
  // The main photo is derived on the first render so its request starts with the
  // page; a thumbnail click only overrides it.
  const [picked, setImg] = useState("");
  const img = picked || p?.image || "";
  const buy = useRef<HTMLDivElement>(null);
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    setImg("");
    if (!p) {
      if (!loading)
        applySeo({
          title: "Produto não encontrado | OHC Motors",
          description: "Este produto não está no catálogo da OHC Motors.",
          path: route.path,
          noindex: true,
        });
      return;
    }
    if (!live) return;
    applySeo(productHead(live));
    track("ViewContent", productParams(live.sku, getPrecoVigente(live).preco));
  }, [live, p, loading, route.path]);
  // Phones: once the visitor scrolls past the buy button, a copy stays docked
  // at the bottom of the screen.
  useEffect(() => {
    const node = buy.current;
    if (!node) return;
    const io = new IntersectionObserver(([entry]) =>
      setSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    io.observe(node);
    return () => io.disconnect();
  }, [p]);
  if (!p)
    return (
      <>
        <Nav />
        <div
          className="wrap py-24 text-center text-ohc-steel"
          aria-live="polite"
        >
          {loading ? (
            "Carregando produto…"
          ) : (
            <>
              Produto não encontrado.{" "}
              <Link href="/catalogo" className="text-ohc-glow">
                Voltar ao catálogo
              </Link>
            </>
          )}
        </div>
        <Footer />
      </>
    );
  const compatHref = `/compatibilidade?sku=${encodeURIComponent(p.sku)}`;
  return (
    <>
      <Nav />
      <LiveryTitle
        as="p"
        lines={[KIND[p.category] || p.category, p.brand]}
        className="-mb-[3vw] livery-paint md:-mb-[1vw]"
        titleClass="text-[clamp(30px,8vw,84px)]"
      />
      <div className="wrap grid gap-6 pb-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12 md:pb-14">
        <div className="decal relative min-w-0 overflow-hidden md:sticky md:top-24 md:self-start">
          {img ? (
            <img
              src={img}
              srcSet={`${small(img)} 560w, ${img} 1000w`}
              sizes="(min-width: 768px) 50vw, 100vw"
              alt={p.name}
              width={1000}
              height={750}
              fetchPriority="high"
              className="aspect-[4/3] w-full bg-[#0e1116] object-contain p-[4%] md:aspect-square md:p-[6%]"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center font-display text-3xl text-[#8b95a3] md:aspect-square">
              Foto em breve
            </div>
          )}
          <DiscountBadge p={p} className="absolute left-3 top-3 text-[22px]" />
          {p.images && p.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {p.images.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setImg(u)}
                  aria-label="Ver foto"
                  aria-pressed={img === u}
                  className={`h-[72px] w-[72px] shrink-0 rounded-md border-2 bg-[#0e1116] p-1.5 ${img === u ? "border-ohc-blue" : "border-ohc-line"}`}
                >
                  <img
                    src={small(u)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <nav
            className="mb-2 flex flex-wrap gap-2 text-xs text-[#c9d0d8]"
            aria-label="Caminho"
          >
            <Link href="/catalogo">Catálogo</Link>
            <span>/</span>
            <Link href={`/catalogo?marca=${encodeURIComponent(p.brand)}`}>
              {p.brand}
            </Link>
          </nav>
          <h1 className="max-w-[18ch] text-[clamp(32px,8.5vw,48px)] md:text-[clamp(40px,5vw,64px)]">
            {p.name}
          </h1>
          <div className="mt-4">
            {live ? (
              <PriceBlock p={live} size="page" />
            ) : (
              <p className="text-sm text-[#c9d0d8]">Carregando preço…</p>
            )}
            <p className="mt-2 inline-flex items-center gap-2 rounded-sm bg-[#182033] px-2.5 py-1 text-[13px] font-semibold text-[#c9d0d8] shadow-[inset_0_0_0_1px_#214fa1]">
              Envio para todo o Brasil
            </p>
          </div>
          <div ref={buy} className="mt-5">
            <BuyLink
              p={p}
              className="btn btn-blue min-h-14 w-full text-base sm:w-auto sm:px-8"
            />
          </div>

          <section aria-labelledby="serve" className="decal mt-8 p-4 sm:p-5">
            <h2 id="serve" className="text-[32px] leading-none">
              Serve no seu carro?
            </h2>
            {p.compat ? (
              <ul className="mt-3 grid gap-1.5 text-[15px] font-semibold sm:grid-cols-2">
                {p.compat.map((c) => (
                  <li
                    key={c}
                    className="before:mr-2.5 before:inline-block before:h-1.5 before:w-3 before:bg-ohc-blue before:align-middle"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[15px] text-[#c9d0d8]">
                Depende da geração e dos comandos do seu carro.
              </p>
            )}
            <FitmentPlate
              p={p}
              className="mt-4 max-sm:[--cells:2]! max-sm:[&>div:last-child]:col-span-2"
            />
            <Link
              href={compatHref}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[#afc8ff] underline underline-offset-4 hover:text-white"
            >
              Confirmar a compatibilidade com a equipe
            </Link>
          </section>

          <ul className="mt-6 grid gap-2 text-[15px] font-semibold">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="livery livery-rule w-6 shrink-0 rounded-sm"
                />
                {t}
              </li>
            ))}
          </ul>

          <dl className="mt-8 grid grid-cols-[110px_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)] [&>dd]:[overflow-wrap:anywhere] border-t border-ohc-line text-[14px] [&>dt]:py-3.5 [&>dd]:py-3.5 [&>dt]:border-b [&>dd]:border-b [&>dt]:border-ohc-line [&>dd]:border-ohc-line [&>dt]:text-[13px] [&>dt]:font-semibold [&>dt]:text-ohc-steel">
            <dt>Acabamento</dt>
            <dd>
              {p.features.length ? p.features.join(" · ") : "Não informado"}
            </dd>
            {p.category === "Volantes" && (
              <>
                <dt>Entrega</dt>
                <dd>
                  O volante vai completo, com airbag, pronto para instalar.
                </dd>
              </>
            )}
            <dt>Garantia</dt>
            <dd>
              90 dias contra defeito e 7 dias para arrependimento, conforme o
              CDC.
            </dd>
            <dt>Envio</dt>
            <dd>
              Sai de São Paulo, SP. O frete e o prazo são calculados no
              atendimento. A OHC não faz instalação; em São Paulo indicamos
              instaladores.
            </dd>
          </dl>
          <section
            className="mt-8 border-t border-ohc-line pt-6"
            aria-labelledby="descricao-produto"
          >
            <h2
              id="descricao-produto"
              className="font-display text-2xl tracking-wide"
            >
              Sobre este produto
            </h2>
            <p className="mt-3 max-w-[65ch] text-[15px] leading-7 text-[#c9d0d8]">
              {productDescription(p)}
            </p>
          </section>
          {p.notes && (
            <div className="decal mt-6 px-4 py-4 text-sm">{p.notes}</div>
          )}
        </div>
      </div>
      <Footer />
      {/* Phones only: the buy button docked after the original scrolls away. */}
      <div
        aria-hidden={!sticky}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-ohc-line bg-ohc-bg px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-200 md:hidden ${sticky ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
        {...(!sticky ? { inert: "" } : {})}
      >
        <BuyLink p={p} className="btn btn-blue min-h-12 w-full text-base" />
      </div>
    </>
  );
}
