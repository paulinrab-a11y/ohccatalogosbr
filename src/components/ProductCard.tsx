/* Product card: a flat decal panel with the real photo, the name and a
   telemetry band (application, code, price). No tilt or spotlight. */
import { Link } from "../lib/router";
import { brl, small, waLink, type Product } from "../lib/products";

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
  return (
    <article className="decal group flex h-full min-w-0 flex-col">
      <Link
        href={`/produto/${encodeURIComponent(p.slug)}`}
        // Inset ring: the decal clips its corner, so an outset outline would be cut.
        className="flex flex-1 flex-col rounded-[inherit] focus-visible:outline-offset-[-3px]"
      >
        <div className="aspect-square bg-[#0e1116]">
          {p.image ? (
            <img
              src={small(p.image)}
              alt={p.name}
              loading="lazy"
              decoding="async"
              width={560}
              height={560}
              className="h-full w-full object-contain p-[7%] transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full place-items-center font-display text-xl tracking-widest text-[#5b6572]">
              Foto em breve
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
          <h3 className="font-body text-[14px] font-bold leading-snug [overflow-wrap:anywhere] [hyphens:auto] sm:text-[15px]">
            {p.name}
          </h3>
          {!compact && p.application && (
            <p className="data-band min-w-0 [overflow-wrap:anywhere]">
              {shortApplication(p.application)}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-ohc-line pt-2.5">
            <span className="data-band">{p.sku}</span>
            <span className="text-sm font-bold text-ohc-text">
              {p.price ? brl(p.price) : "Consultar"}
            </span>
          </div>
        </div>
      </Link>
      {!compact && (
        <a
          className="flex min-h-11 items-center gap-2 border-t border-ohc-line px-3.5 text-[13px] font-bold text-[#3fd97a] hover:text-[#6ff09d] sm:px-4"
          href={waLink(
            `Olá! Tenho interesse no ${p.name} (SKU ${p.sku}). Meu carro é: `,
          )}
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
