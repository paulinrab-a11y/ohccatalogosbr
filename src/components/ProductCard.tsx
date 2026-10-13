/* Product card: a flat decal panel with the real photo, the name, one quiet
   line of fitment and the current price. Every card in a row lines up: the
   name takes what it needs, fitment is held to two lines and the price sits
   on the bottom edge. The whole card opens the product page, where the full
   fitment plate and the code live; WhatsApp is a secondary shortcut. */
import { Link } from "../lib/router";
import { fitmentLine, small, waLink, type Product } from "../lib/products";
import { getPrecoVigente } from "../lib/pricing";
import { productMessage } from "../lib/attribution";
import { productParams, track } from "../lib/pixel";
import PriceBlock, { DiscountBadge } from "./PriceBlock";

export default function ProductCard({
  p,
  compact = false,
}: {
  p: Product;
  compact?: boolean;
}) {
  const price = getPrecoVigente(p).preco;
  const fitment = fitmentLine(p);
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
        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <h3 className="font-body text-[14px] font-bold leading-snug text-pretty [overflow-wrap:break-word] sm:text-[15px]">
            {p.name}
          </h3>
          {!compact && fitment && (
            <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-snug text-ohc-steel">
              <span className="sr-only">Aplicação: </span>
              {fitment}
            </p>
          )}
          <div className="mt-auto pt-3">
            <PriceBlock p={p} />
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
