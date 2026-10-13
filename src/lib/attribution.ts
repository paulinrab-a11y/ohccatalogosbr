/* Where the visitor came from (a Meta ad, a campaign link), kept for the visit
   so the WhatsApp message can tell the team which ad brought the customer.
   Only the campaign name travels; nothing personal. Storage may be blocked. */
import { formatBRL } from "./pricing";
import { waLink } from "./products";

const KEY = "ohc-ref";

type Ref = { source: string; campaign: string; ad: boolean };

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

/** Reads utm_source / utm_campaign / fbclid from a landing URL. */
export function parseRef(search: URLSearchParams): Ref | null {
  const source = slug(search.get("utm_source") || "");
  const campaign = slug(search.get("utm_campaign") || "");
  const ad = search.has("fbclid");
  if (!source && !campaign && !ad) return null;
  return { source, campaign, ad };
}

/** Called once per page load; the first ad that brought the visit wins. */
export function captureRef(search: URLSearchParams) {
  const ref = parseRef(search);
  if (!ref) return;
  try {
    if (!sessionStorage.getItem(KEY))
      sessionStorage.setItem(KEY, JSON.stringify(ref));
  } catch {
    /* storage blocked: the message simply goes without a reference */
  }
}

function storedRef(): Ref | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Ref) : null;
  } catch {
    return null;
  }
}

/** "(ref: meta-volantes-bmw)" or "" when the visit did not come from a campaign. */
export function refTag(ref: Ref | null = storedRef()) {
  if (!ref) return "";
  const source = ref.source || (ref.ad ? "meta" : "");
  const parts = [source, ref.campaign].filter(Boolean);
  return parts.length ? ` (ref: ${parts.join("-")})` : "";
}

/** The message a product's WhatsApp button sends. */
export function productMessage(
  product: { name: string; sku: string },
  price: number | null,
  ref: Ref | null = storedRef(),
) {
  const seen =
    price != null
      ? `que vi no site por ${formatBRL(price)} no PIX. Pode me ajudar?`
      : "que vi no site. Pode me passar o preço?";
  return `Olá! Tenho interesse no ${product.name} (código ${product.sku}), ${seen}${refTag(ref)}`;
}

/** WhatsApp link with a free text plus the campaign reference, if any. */
export const waWithRef = (text: string) => waLink(`${text}${refTag()}`);
