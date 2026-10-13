import { useEffect, useState } from "react";
import raw from "../data/products.json";
import { getPrecoVigente } from "./pricing";

export type Product = {
  sku: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string | null;
  images?: string[];
  features: string[];
  application: string;
  compat: string[] | null;
  /** PIX price (already discounted). */
  price: number | null;
  /** Total on card, paid in 3x interest-free; optional. */
  cardPrice?: number | null;
  promoPrice?: number | null;
  promoStart?: string | null;
  promoEnd?: string | null;
  /** Demonstration price (previews only, never production). */
  priceDemo?: boolean;
  notes: string | null;
  /** Model years when the catalog has them, e.g. "2015–2020". */
  years?: string | null;
};
export const PRODUCTS = raw as Product[];
const WA = "5511955798211";
export const waLink = (text: string) =>
  `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
export const CATS = ["Volantes", "Grades", "Faróis & Lanternas", "Acessórios"];
export const brands = (products: Product[] = PRODUCTS) =>
  [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
export const small = (src: string) =>
  src && src.startsWith("/img/p/") ? src.replace(".webp", "-s.webp") : src;
/** simple text index used by "Busque pelo seu carro" */
export const matches = (p: Product, q: string) => {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [
    p.name,
    p.sku,
    p.application,
    p.brand,
    ...(p.features || []),
    ...(p.compat || []),
  ]
    .join(" ")
    .toLowerCase()
    .includes(s);
};

type DbProduct = {
  sku: string;
  slug?: string | null;
  categoria?: string | null;
  tipo_produto?: string | null;
  marca?: string | null;
  nome_produto?: string | null;
  material?: string | null;
  recursos?: string | null;
  descricao?: string | null;
  imagem_principal?: string | null;
  outras_imagens?: string | null;
  geracao_chassi?: string | null;
  ano_inicio?: number | null;
  ano_fim?: number | null;
  shift_light?: string | null;
  compatibilidade?: string | null;
  price?: number | null;
  card_price?: number | null;
  promotional_price?: number | null;
  promotional_price_starts_at?: string | null;
  promotional_price_ends_at?: string | null;
  price_demo?: boolean;
  ativo?: boolean;
};

let cachedLive: Product[] | null = null;

function splitText(value?: string | null) {
  if (!value) return [];
  return value
    .split(/\s*\|\s*|\s*;\s*|\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveImage(
  value: string | null | undefined,
  fallback: string | null = null,
) {
  const v = String(value || "").trim();
  if (!v) return fallback;
  if (/^\/?imagens\//i.test(v)) return fallback || `/${v.replace(/^\//, "")}`;
  if (/^https?:\/\//i.test(v) || (v.startsWith("/") && !v.startsWith("//")))
    return v;
  // O banco legado ainda contém caminhos /imagens/... da versão antiga. O pacote v20
  // usa /img/p/<SKU>, então preservamos a foto local por SKU até que a mídia seja migrada.
  if (v.startsWith("imagens/") && fallback) return fallback;
  return fallback;
}

export function yearRange(start?: number | null, end?: number | null) {
  if (start && end) return start === end ? String(start) : `${start}–${end}`;
  if (start) return `a partir de ${start}`;
  if (end) return `até ${end}`;
  return null;
}

/** Maps one public catalog row (Supabase) to a site product. */
export function dbToProduct(row: DbProduct): Product {
  const fallback = PRODUCTS.find((p) => p.sku === row.sku);
  const extra = splitText(row.outras_imagens)
    .map((src, i) => resolveImage(src, fallback?.images?.[i + 1] || null))
    .filter(Boolean) as string[];
  const image = resolveImage(row.imagem_principal, fallback?.image || null);
  const features = splitText(row.recursos);
  if (!features.length && row.material) features.push(row.material);
  const compatText = String(row.compatibilidade || "").trim();
  const compat =
    compatText && !/^(confirmar|a confirmar|sob an[aá]lise)/i.test(compatText)
      ? splitText(compatText)
      : null;
  const images = [image, ...extra].filter(
    (value, index, array): value is string =>
      Boolean(value) && array.indexOf(value) === index,
  );
  return {
    sku: row.sku,
    slug:
      row.slug ||
      fallback?.slug ||
      row.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: row.nome_produto || fallback?.name || row.sku,
    brand: row.marca || fallback?.brand || "OHC Motors",
    category:
      row.categoria || fallback?.category || row.tipo_produto || "Acessórios",
    image,
    images: images.length ? images : fallback?.images,
    features: features.length ? features : fallback?.features || [],
    application:
      row.geracao_chassi && row.geracao_chassi !== "A confirmar"
        ? row.geracao_chassi
        : fallback?.application || "Aplicação sob análise",
    compat,
    price: row.price ?? null,
    cardPrice: row.card_price ?? null,
    promoPrice: row.promotional_price ?? null,
    promoStart: row.promotional_price_starts_at ?? null,
    promoEnd: row.promotional_price_ends_at ?? null,
    priceDemo: row.price_demo === true,
    notes: row.descricao || fallback?.notes || null,
    years: yearRange(row.ano_inicio, row.ano_fim),
  };
}

let inflight: Promise<Product[] | null> | null = null;

/** Resolves to the live catalog, or null when /api/catalog fails. */
function loadLiveProducts(): Promise<Product[] | null> {
  if (!inflight)
    inflight = fetch("/api/catalog", {
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catálogo dinâmico indisponível.");
        const data = await response.json();
        if (!Array.isArray(data?.products))
          throw new Error("Catálogo dinâmico inválido.");
        // Rows without SKU have no product page; skip them before mapping.
        const next: Product[] = data.products
          .filter((row: DbProduct) => row.ativo === true && row.sku)
          .map(dbToProduct);
        cachedLive = next;
        return next;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  return inflight;
}

/**
 * Live catalog with a loading flag. While the first request is pending the list
 * is empty and `loading` is true, so pages can avoid showing "not found". If the
 * API fails, the last live list is kept, or the bundled catalog is used.
 */
export function useCatalog() {
  const [state, setState] = useState<{
    products: Product[];
    loading: boolean;
  }>(() =>
    cachedLive
      ? { products: cachedLive, loading: false }
      : { products: [], loading: true },
  );
  useEffect(() => {
    let live = true;
    loadLiveProducts().then((next) => {
      if (live)
        setState({ products: next ?? cachedLive ?? PRODUCTS, loading: false });
    });
    return () => {
      live = false;
    };
  }, []);
  return state;
}

export function useProducts() {
  return useCatalog().products;
}

/**
 * Products with a promotion running right now. Re-evaluated every minute, so a
 * promotion appears and disappears on its dates without a new deploy.
 */
export function usePromotions() {
  const { products, loading } = useCatalog();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return {
    loading,
    promos: products.filter((p) => getPrecoVigente(p, now).emPromocao),
  };
}

const slugOf = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Short names an ad link may use: /catalogo?categoria=volantes&marca=bmw
const CATEGORY_ALIASES: Record<string, string> = {
  volantes: "Volantes",
  volante: "Volantes",
  grades: "Grades",
  grade: "Grades",
  farois: "Faróis & Lanternas",
  lanternas: "Faróis & Lanternas",
  "farois-lanternas": "Faróis & Lanternas",
  "farois-e-lanternas": "Faróis & Lanternas",
  acessorios: "Acessórios",
  demais: "Acessórios",
};
const BRAND_ALIASES: Record<string, string> = {
  vw: "volkswagen",
  mb: "mercedes",
};

/** A category from a URL value, in any case or as a short slug. */
export function resolveCategory(value: string | null) {
  if (!value) return "";
  const s = slugOf(value);
  return CATS.find((c) => slugOf(c) === s) || CATEGORY_ALIASES[s] || "";
}

/** A catalog brand from a URL value: "bmw", "mercedes" or "Mercedes-Benz". */
export function resolveBrand(value: string | null, products: Product[]) {
  if (!value) return "";
  const s = BRAND_ALIASES[slugOf(value)] || slugOf(value);
  const list = brands(products);
  return (
    list.find((b) => slugOf(b) === s) ||
    list.find((b) => slugOf(b).startsWith(`${s}-`)) ||
    ""
  );
}

/** The product written into a build-time product page (no prices), so the page
    renders before the catalog arrives. Only for the slug being viewed. */
export function embeddedProduct(slug: string): Product | null {
  if (typeof document === "undefined") return null;
  try {
    const raw = document.getElementById("ohc-product")?.textContent;
    const product = raw ? (JSON.parse(raw) as Product) : null;
    return product && product.slug === slug ? product : null;
  } catch {
    return null;
  }
}
