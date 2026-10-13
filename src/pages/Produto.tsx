import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { Link, useRoute } from "../lib/router";
import { useCatalog, brl, small, waLink } from "../lib/products";
import {
  applySeo,
  productDescription,
  productSchema,
  productTitle,
  productUrl,
} from "../lib/seo";
function productSlug(path: string) {
  if (!path.startsWith("/produto/")) return "";
  try {
    return decodeURIComponent(path.slice("/produto/".length));
  } catch {
    return "";
  }
}
export default function Produto() {
  const { products, loading } = useCatalog();
  const { route } = useRoute();
  const slug = productSlug(route.path);
  const p = products.find(
    (x) => x.slug === slug || x.sku === route.search.get("sku"),
  );
  // The main photo is derived on the first render so its request starts with the
  // page; a thumbnail click only overrides it.
  const [picked, setImg] = useState("");
  const img = picked || p?.image || "";
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
    applySeo({
      title: productTitle(p),
      description: productDescription(p),
      path: `/produto/${encodeURIComponent(p.slug)}`,
      schema: {
        ...productSchema(p),
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Catálogo",
              item: "https://www.ohcmotorsbr.com.br/catalogo",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: p.brand,
              item: `https://www.ohcmotorsbr.com.br/catalogo?marca=${encodeURIComponent(p.brand)}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: p.name,
              item: productUrl(p),
            },
          ],
        },
      },
    });
  }, [p, loading, route.path]);
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
  return (
    <>
      <Nav />
      <div className="wrap grid gap-8 py-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-12 md:py-12">
        <div className="decal min-w-0 overflow-hidden md:sticky md:top-24 md:self-start">
          {img ? (
            <img
              src={img}
              alt={p.name}
              width={1000}
              height={1000}
              fetchPriority="high"
              className="aspect-square w-full bg-[#0e1116] object-contain p-[6%]"
            />
          ) : (
            <div className="grid aspect-square place-items-center font-display text-3xl text-[#3A4350]">
              Foto em breve
            </div>
          )}
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
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <nav
            className="mb-4 flex flex-wrap gap-2 text-xs text-[#c9d0d8]"
            aria-label="Caminho"
          >
            <Link href="/catalogo">Catálogo</Link>
            <span>/</span>
            <Link href={`/catalogo?marca=${encodeURIComponent(p.brand)}`}>
              {p.brand}
            </Link>
            <span>/</span>
            <span>{p.category}</span>
          </nav>
          <h1 className="text-[clamp(34px,9vw,48px)] md:text-[clamp(40px,5vw,64px)] max-w-[16ch]">
            {p.name}
          </h1>
          <p className="data-band mt-3 mb-5 [overflow-wrap:anywhere]">
            {p.application && (
              <>
                <b>{p.application}</b> ·{" "}
              </>
            )}
            Código <b>{p.sku}</b>
          </p>
          <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {p.price ? (
              <>
                <span className="font-display text-[46px] leading-none">
                  {brl(p.price)}
                </span>
                <span className="text-[13px] text-ohc-steel">
                  no PIX, ou em até 12x no cartão
                </span>
              </>
            ) : (
              <>
                <span className="font-display text-[46px] leading-none">
                  Sob consulta
                </span>
                <span className="text-[13px] text-ohc-steel">
                  preço e prazo pelo WhatsApp
                </span>
              </>
            )}
          </div>
          <div className="mb-8 flex flex-wrap gap-2.5">
            <a
              className="ub-wa"
              href={waLink(
                `Olá! Tenho interesse no ${p.name} (SKU ${p.sku}). Meu carro é: `,
              )}
              target="_blank"
              rel="noopener"
            >
              Pedir pelo WhatsApp
            </a>
            <Link
              href={`/compatibilidade?sku=${encodeURIComponent(p.sku)}`}
              className="btn btn-ghost"
            >
              Confirmar compatibilidade
            </Link>
          </div>
          <dl className="grid grid-cols-[110px_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)] [&>dd]:[overflow-wrap:anywhere] border-t border-ohc-line text-[14px] [&>dt]:py-3.5 [&>dd]:py-3.5 [&>dt]:border-b [&>dd]:border-b [&>dt]:border-ohc-line [&>dd]:border-ohc-line [&>dt]:text-[13px] [&>dt]:font-semibold [&>dt]:text-ohc-steel">
            <dt>Aplicação</dt>
            <dd>{p.application}</dd>
            <dt>Compatível com</dt>
            <dd>
              {p.compat ? (
                <ul className="grid gap-1.5 sm:grid-cols-2">
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
                <span className="text-ohc-steel">
                  Depende da geração e dos comandos do seu carro.{" "}
                  <Link
                    href={`/compatibilidade?sku=${encodeURIComponent(p.sku)}`}
                    className="text-ohc-glow"
                  >
                    Confirme antes de comprar.
                  </Link>
                </span>
              )}
            </dd>
            <dt>Acabamento</dt>
            <dd>
              {p.features.length ? p.features.join(" · ") : "Não informado"}
            </dd>
            {p.category === "Volantes" && (
              <>
                <dt>Entrega</dt>
                <dd>O volante vai completo, pronto para instalar.</dd>
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
              atendimento.
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
    </>
  );
}
