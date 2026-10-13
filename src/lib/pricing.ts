/* Prices shown on the site. Every price, promotion badge and installment line
   goes through getPrecoVigente(); components never decide promotions alone.
   price = PIX price (already discounted). cardPrice = total on card (up to 12x),
   optional. A promotion counts only when it is lower than the regular price and
   "now" is inside its window; empty dates leave that side open. */

export type Priced = {
  price: number | null;
  cardPrice?: number | null;
  promoPrice?: number | null;
  promoStart?: string | null;
  promoEnd?: string | null;
};

export type PrecoVigente = {
  /** Price to charge on PIX right now, or null when the product has none. */
  preco: number | null;
  /** The regular price, only while a promotion is running. */
  precoAntigo: number | null;
  emPromocao: boolean;
  descontoPercentual: number;
  /** End of the running promotion, when it has one. */
  validoAte: Date | null;
};

const time = (value?: string | null) => {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : null;
};

export function getPrecoVigente(
  product: Priced,
  agora: Date = new Date(),
): PrecoVigente {
  const regular =
    product.price != null && product.price > 0 ? product.price : null;
  const none: PrecoVigente = {
    preco: regular,
    precoAntigo: null,
    emPromocao: false,
    descontoPercentual: 0,
    validoAte: null,
  };
  const promo = product.promoPrice;
  if (regular == null || promo == null || !(promo > 0) || promo >= regular)
    return none;
  const now = agora.getTime();
  const start = time(product.promoStart);
  const end = time(product.promoEnd);
  if ((start != null && now < start) || (end != null && now > end)) return none;
  return {
    preco: promo,
    precoAntigo: regular,
    emPromocao: true,
    descontoPercentual: Math.round((1 - promo / regular) * 100),
    validoAte: end != null ? new Date(end) : null,
  };
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
export const formatBRL = (value: number) => BRL.format(value);

/** One of 12 installments of the card price, rounded up to the cent. Only when
    a card price is registered; it is never derived from the PIX price. */
export function parcela(cardPrice?: number | null) {
  if (cardPrice == null || !(cardPrice > 0)) return null;
  return Math.ceil((cardPrice / 12) * 100 - 1e-9) / 100;
}

/** "31/10" in São Paulo time, for "Oferta válida até dd/mm". */
export function diaMes(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
