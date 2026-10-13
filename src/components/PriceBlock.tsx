/* The price where the customer already is: the card and the product page.
   Everything comes from getPrecoVigente(); this component only lays it out. */
import { diaMes, formatBRL, getPrecoVigente, parcela } from "../lib/pricing";
import type { Product } from "../lib/products";

export function DiscountBadge({
  p,
  className = "",
}: {
  p: Product;
  className?: string;
}) {
  const v = getPrecoVigente(p);
  if (!v.emPromocao) return null;
  return (
    <span
      className={`inline-flex items-center rounded-sm bg-ohc-red px-2 py-0.5 font-display text-[18px] leading-none tracking-wide text-white ${className}`}
    >
      -{v.descontoPercentual}%
    </span>
  );
}

export default function PriceBlock({
  p,
  size = "card",
}: {
  p: Product;
  size?: "card" | "page";
}) {
  const v = getPrecoVigente(p);
  const page = size === "page";
  if (v.preco == null)
    return (
      <p
        className={`font-bold text-ohc-text ${page ? "font-display text-[clamp(36px,9vw,46px)] font-normal leading-none" : "text-sm"}`}
      >
        Consulte no WhatsApp
      </p>
    );
  const installment = parcela(p.cardPrice);
  return (
    <div className={page ? "grid gap-1.5" : "grid gap-0.5"}>
      {v.emPromocao && v.precoAntigo != null && (
        <p className={`text-[#8b95a3] ${page ? "text-base" : "text-[12px]"}`}>
          De <s>{formatBRL(v.precoAntigo)}</s>
        </p>
      )}
      <p className="flex flex-wrap items-baseline gap-x-2">
        {v.emPromocao && (
          <span className={page ? "text-base text-[#c9d0d8]" : "sr-only"}>
            Por
          </span>
        )}
        <span
          className={`font-display leading-none tracking-wide text-white ${page ? "text-[clamp(44px,11vw,60px)]" : "text-[23px] sm:text-[28px]"}`}
        >
          {formatBRL(v.preco)}
        </span>
        <span
          className={`font-semibold text-[#c9d0d8] ${page ? "text-base" : "text-[12px]"}`}
        >
          no PIX
        </span>
      </p>
      <p
        className={`text-[#c9d0d8] ${page ? "text-sm" : "text-[12px] leading-snug"}`}
      >
        {installment != null
          ? `ou 3x de ${formatBRL(installment)} sem juros no cartão`
          : "ou 3x sem juros no cartão"}
        {page && " (até 12x com juros)"}
      </p>
      {page && v.emPromocao && v.validoAte && (
        <p className="text-sm font-semibold text-[#ff8a8f]">
          Oferta válida até {diaMes(v.validoAte)}
        </p>
      )}
      {p.priceDemo && (
        <p className="text-[11px] font-semibold text-amber-300">
          Preço de demonstração (prévia)
        </p>
      )}
    </div>
  );
}
