/* Product card = SpotlightCard + TiltedCard (React Bits) + Uiverse-style WhatsApp button; real cutout photos only. */
import SpotlightCard from "./SpotlightCard";
import TiltedCard from "./TiltedCard";
import { Link } from "../lib/router";
import { brl, small, waLink, type Product } from "../lib/products";
export default function ProductCard({
  p,
  compact = false,
}: {
  p: Product;
  compact?: boolean;
}) {
  return (
    <TiltedCard className="group h-full">
      <SpotlightCard className="flex h-full flex-col">
        <Link
          href={`/produto/${encodeURIComponent(p.slug)}`}
          // Inset ring: the card clips overflow, so the default outset outline would be hidden.
          className="block rounded-[inherit] focus-visible:outline-offset-[-3px]"
        >
          <div className="aspect-square studio-bg">
            {p.image ? (
              <img
                src={small(p.image)}
                alt={p.name}
                loading="lazy"
                decoding="async"
                width={560}
                height={560}
                className="h-full w-full object-contain p-[8%] filter-[drop-shadow(0_18px_24px_rgba(0,0,0,.55))]"
              />
            ) : (
              <div className="grid h-full place-items-center font-display text-xl tracking-widest text-[#3A4350]">
                Foto em breve
              </div>
            )}
          </div>
          <div className={`px-4 pt-4 ${compact ? "pb-4" : ""}`}>
            <h3 className="font-body text-[15px] font-bold leading-snug">
              {p.name}
            </h3>
            {!compact && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[p.application, ...p.features.slice(0, 2)]
                  .filter(Boolean)
                  .map((f, i) => (
                    <span
                      key={i}
                      className={`rounded-sm px-2 py-0.5 text-[11px] font-semibold ${i === 0 ? "bg-ohc-blueDeep text-white" : "border border-ohc-line text-[#C9D0D8]"}`}
                    >
                      {f}
                    </span>
                  ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-ohc-steel">
              <span>{p.sku}</span>
              <span className="text-sm font-bold text-ohc-text">
                {p.price ? brl(p.price) : "Consultar"}
              </span>
            </div>
          </div>
        </Link>
        {!compact && (
          <div className="mt-auto p-4 pt-3">
            <a
              className="ub-wa w-full text-center"
              href={waLink(
                `Olá! Tenho interesse no ${p.name} (SKU ${p.sku}). Meu carro é: `,
              )}
              target="_blank"
              rel="noopener"
            >
              Pedir pelo WhatsApp
            </a>
          </div>
        )}
      </SpotlightCard>
    </TiltedCard>
  );
}
