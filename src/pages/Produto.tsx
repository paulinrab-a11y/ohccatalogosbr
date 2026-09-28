import { useState } from "react";
import Nav from "../components/Nav";
import AmbientLighting from "../components/AmbientLighting";
import Footer from "../components/Footer";
import { Link, useRoute } from "../lib/router";
import { useProducts, brl, small, waLink } from "../lib/products";
export default function Produto() {
  const products = useProducts();
  const { route } = useRoute();
  const p = products.find((x) => x.sku === route.search.get("sku"));
  const [img, setImg] = useState(p?.image || "");
  if (!p)
    return (
      <>
        <Nav />
        <div className="wrap py-24 text-center text-ohc-steel">
          Produto não encontrado.{" "}
          <Link href="/catalogo" className="text-ohc-glow">
            Voltar ao catálogo
          </Link>
        </div>
        <Footer />
      </>
    );
  document.title = `${p.name} | OHC Motors`;
  return (
    <>
      <AmbientLighting />
      <Nav />
      <div className="wrap grid gap-8 py-8 md:grid-cols-[1.1fr_1fr] md:gap-12 md:py-12">
        <div className="md:sticky md:top-24 md:self-start rounded-xl border border-ohc-line studio-bg overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={p.name}
              className="aspect-square w-full object-contain p-[6%] [filter:drop-shadow(0_30px_40px_rgba(0,0,0,.6))]"
            />
          ) : (
            <div className="grid aspect-square place-items-center font-display text-3xl text-[#3A4350]">
              Foto em breve
            </div>
          )}
          {p.images && p.images.length > 1 && (
            <div className="flex gap-2 px-3 pb-3">
              {p.images.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setImg(u)}
                  aria-label="Ver foto"
                  className={`h-[72px] w-[72px] rounded-md border bg-ohc-bg2 p-1.5 ${img === u ? "border-ohc-glow" : "border-ohc-line"}`}
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
        <div>
          <nav
            className="mb-4 flex gap-2 text-xs text-ohc-steel"
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
          <p className="mt-2 mb-5 text-[13px] text-ohc-steel">
            SKU <b className="text-ohc-text">{p.sku}</b>
          </p>
          <div className="mb-6 flex items-baseline gap-3">
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
          <dl className="grid grid-cols-[130px_1fr] border-t border-ohc-line text-[14px] [&>dt]:py-3.5 [&>dd]:py-3.5 [&>dt]:border-b [&>dd]:border-b [&>dt]:border-ohc-line [&>dd]:border-ohc-line [&>dt]:text-[13px] [&>dt]:font-semibold [&>dt]:text-ohc-steel">
            <dt>Aplicação</dt>
            <dd>{p.application}</dd>
            <dt>Compatível com</dt>
            <dd>
              {p.compat ? (
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {p.compat.map((c) => (
                    <li
                      key={c}
                      className="before:mr-2.5 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:bg-ohc-glow before:align-middle"
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
          {p.notes && (
            <div className="mt-6 rounded-r-md border-l-[3px] border-ohc-glow bg-ohc-bg2 px-4 py-4 text-sm">
              {p.notes}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
