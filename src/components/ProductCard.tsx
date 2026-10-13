/* Product card: a flat decal panel with the real photo, the name, the fitment
   plate and the current price. The whole card opens the product page; WhatsApp
   is a secondary shortcut. No tilt or spotlight. */
import { Link } from "../lib/router";
import { small, waLink, type Product } from "../lib/products";
import { getPrecoVigente } from "../lib/pricing";
import { productMessage } from "../lib/attribution";
import { productParams, track } from "../lib/pixel";
import FitmentPlate from "./FitmentPlate";
import PriceBlock, { DiscountBadge } from "./PriceBlock";

/** Long chassis lists ("F15/F16/F20/…") read as the first three plus a count. */
function shortApplication(application: string) {
  const codes = application.split("/").map((c) => c.trim());
  if (codes.length <= 3) return application;
  return `${codes.slice(0, 3).join("/")} +${codes.length - 3}`;
}

export default function ProductCard({
  p,
  compact = false,
}: {
  p: Product;
  compact?: boolean;
}) {
  const price = getPrecoVigente(p).preco;
  return (
    <article className="decal group flex h-full min-w-0 flex-col">
      <Link
        href={`/produto/${encodeURIComponent(p.slug)}`}
        // Inset ring: the decal clips its corner, so an outset outline would be cut.
        className="flex flex-1 flex-col rounded-[inherit] focus-visible:outline-offset-[-3px]"
      >
        <div className="relative aspect-square bg-[#0e1116]">
          {p.image ? (
            <img
              src={small(p.image)}
              alt={p.name}
              loading="lazy"
              decoding="async"
              width={560}
              height={560}
              className="h-full w-full object-contain p-[7%] transition-transform duration-150 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full place-items-center font-display text-xl tracking-widest text-[#5b6572]">
              Foto em breve
            </div>
          )}
          <DiscountBadge p={p} className="absolute left-2.5 top-2.5" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
          <h3 className="font-body text-[14px] font-bold leading-snug [overflow-wrap:anywhere] sm:text-[15px]">
            {p.name}
          </h3>
          {!compact && (
            <FitmentPlate
              p={p}
              application={shortApplication(p.application)}
              showCode={false}
              variant="rows"
              className="[--plate-bg:#12151b] [&_dd]:text-[13px]"
            />
          )}
          <div className="mt-auto border-t border-ohc-line pt-2.5">
            <PriceBlock p={p} />
            <p className="data-band mt-1.5">{p.sku}</p>
          </div>
        </div>
      </Link>
      {!compact && (
        <a
          className="flex min-h-11 items-center gap-1.5 whitespace-nowrap border-t border-ohc-line px-3.5 text-[12px] font-bold sm:gap-2 sm:text-[13px] text-[#3fd97a] hover:text-[#6ff09d] sm:px-4"
          href={waLink(productMessage(p, price))}
          onClick={() => track("Contact", productParams(p.sku, price))}
          target="_blank"
          rel="noopener"
          aria-label={`Pedir ${p.name} pelo WhatsApp`}
        >
          Pedir no WhatsApp
          <span aria-hidden="true">→</span>
        </a>
      )}
    </article>
  );
}
