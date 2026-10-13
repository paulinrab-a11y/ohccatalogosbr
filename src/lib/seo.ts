import {
  PRODUCTS,
  resolveBrand,
  resolveCategory,
  type Product,
} from "./products";
import { getPrecoVigente } from "./pricing";

const SITE_ORIGIN = "https://www.ohcmotorsbr.com.br";
const SITE_NAME = "OHC Motors";
/** Share image for pages without a product photo (1200×630). */
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og/ohc-motors.jpg`;

/** Everything one page says about itself to search engines and link previews. */
export type PageHead = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "product";
  schema?: unknown;
  noindex?: boolean;
  /** Left out of the shared SPA shell, which other routes reuse. */
  canonical?: boolean;
};

/**
 * Catalog filters that may shape the title and canonical URL. Tracking
 * parameters (utm_*, fbclid), the search box and unknown values are ignored,
 * so they never create indexable duplicates.
 */
export function catalogSeoContext(
  search: URLSearchParams,
  products: Product[] = PRODUCTS,
) {
  const category = resolveCategory(search.get("categoria"));
  const brand = resolveBrand(search.get("marca"), products);
  const params = new URLSearchParams();
  if (category) params.set("categoria", category);
  if (brand) params.set("marca", brand);
  const context = [category, brand].filter(Boolean).join(" · ");
  return { context, path: context ? `/catalogo?${params}` : "/catalogo" };
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Photos are stored as site paths or full URLs; previews need full URLs. */
function absoluteImage(src: string | null | undefined) {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  return `${SITE_ORIGIN}${src.startsWith("/") ? "" : "/"}${src}`;
}

function productType(product: Product) {
  if (product.category === "Volantes") return "volante";
  if (product.category === "Grades") return "grade automotiva";
  if (product.category === "Faróis & Lanternas")
    return "farol ou lanterna automotiva";
  return "acessório automotivo";
}

// What the product is, for titles: "Volante BMW M3 - Carbono".
const KIND: Record<string, string> = {
  Volantes: "Volante",
  Grades: "Grade",
};

export function productDescription(product: Product) {
  const type = productType(product);
  const finish = product.features.length
    ? ` com ${product.features.join(", ")}`
    : "";
  const application = product.application
    ? ` para aplicação ${product.application}`
    : "";
  // Compatibility is confirmed by the team on WhatsApp, never promised here.
  // This sentence must survive the 300-character limit, so only the lead is
  // shortened and notes are added only when they fit whole.
  const required =
    "Consulte preço, prazo e instalação pelo WhatsApp. Confirme a compatibilidade com o seu carro antes da compra.";
  const lead = clean(`${product.name}: ${type}${finish}${application}.`);
  const max = 300 - required.length - 1;
  const head =
    lead.length > max ? `${lead.slice(0, max - 1).trimEnd()}…` : lead;
  const text = `${head} ${required}`;
  const notes = product.notes ? clean(product.notes) : "";
  return notes && text.length + notes.length + 1 <= 300
    ? `${text} ${notes}`
    : text;
}

export function productTitle(product: Product) {
  const kind = KIND[product.category];
  const name = clean(product.name);
  // Say what it is unless the name already does ("Grade Panamericana…").
  const label =
    kind && !name.toLowerCase().startsWith(kind.toLowerCase())
      ? `${kind} ${name}`
      : name;
  // The application ("F30", "W205") helps searches by car, when short and new.
  const app = clean(product.application || "");
  const withApp =
    app &&
    app.length <= 24 &&
    !/confirmar|an[aá]lise/i.test(app) &&
    !name.toLowerCase().includes(app.toLowerCase())
      ? `${label} (${app})`
      : label;
  return `${withApp} | ${SITE_NAME}`;
}

function productUrl(product: Product) {
  return `${SITE_ORIGIN}/produto/${encodeURIComponent(product.slug)}`;
}

function productSchema(product: Product) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand || SITE_NAME },
    category: product.category,
    description: productDescription(product),
    url: productUrl(product),
  };
  const image = absoluteImage(product.image);
  if (image) schema.image = [image];
  // The price charged now: the promotional one while a promotion runs.
  const { preco, validoAte } = getPrecoVigente(product);
  if (preco != null && !product.priceDemo) {
    schema.offers = {
      "@type": "Offer",
      url: productUrl(product),
      priceCurrency: "BRL",
      price: preco,
      ...(validoAte
        ? { priceValidUntil: validoAte.toISOString().slice(0, 10) }
        : {}),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    };
  }
  return schema;
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/ohc-logo.webp`,
  areaServed: "BR",
  sameAs: ["https://www.instagram.com/ohcmotorsbr/"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  inLanguage: "pt-BR",
};

/* Page heads, shared by the pages (applied in the browser) and by the build
   (written into each page's HTML so previews and crawlers see them without JS). */

export const homeHead: PageHead = {
  title: "OHC Motors | Volantes esportivos e acessórios automotivos",
  description:
    "Volantes esportivos OHC Motors em couro, carbono e Alcântara, grades Mercedes com LED e acessórios automotivos. Consulte compatibilidade e atendimento pelo WhatsApp.",
  path: "/",
  schema: {
    "@context": "https://schema.org",
    "@graph": [organizationSchema, websiteSchema],
  },
};

export const compatibilityHead: PageHead = {
  title: "Consultar compatibilidade do volante | OHC Motors",
  description:
    "Descubra se um volante OHC Motors é compatível com seu carro. Informe marca, modelo, ano e versão e envie fotos para uma análise segura.",
  path: "/compatibilidade",
  schema: websiteSchema,
};

// Promotions come and go, so the page is not indexed.
export const promotionsHead: PageHead = {
  title: "Promoções | OHC Motors",
  description:
    "Volantes e acessórios OHC Motors em oferta por tempo limitado. Preço no PIX ou em 3x sem juros no cartão, com envio para todo o Brasil.",
  path: "/promocoes",
  noindex: true,
};

export function catalogHead(
  search: URLSearchParams,
  products: Product[] = PRODUCTS,
): PageHead {
  const { context, path } = catalogSeoContext(search, products);
  return {
    title: context
      ? `${context} | Catálogo OHC Motors`
      : "Catálogo de volantes e acessórios | OHC Motors",
    description: context
      ? `Encontre produtos OHC Motors para ${context}. Veja fotos, materiais, aplicações, preço e confirme a compatibilidade antes da compra.`
      : "Catálogo OHC Motors de volantes esportivos, grades Mercedes, faróis e acessórios automotivos. Filtre por marca, categoria ou veículo.",
    path,
    schema: websiteSchema,
  };
}

export function productHead(product: Product): PageHead {
  return {
    title: productTitle(product),
    description: productDescription(product),
    path: `/produto/${encodeURIComponent(product.slug)}`,
    image: absoluteImage(product.image),
    type: "product",
    schema: {
      ...productSchema(product),
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Catálogo",
            item: `${SITE_ORIGIN}/catalogo`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: product.brand,
            item: `${SITE_ORIGIN}/catalogo?marca=${encodeURIComponent(product.brand)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.name,
            item: productUrl(product),
          },
        ],
      },
    },
  };
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let node = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${CSS.escape(key)}"]`,
  );
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.content = content;
}

function setCanonical(url: string) {
  let node = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!node) {
    node = document.createElement("link");
    node.rel = "canonical";
    document.head.appendChild(node);
  }
  node.href = url;
}

function setJsonLd(id: string, value: unknown) {
  let node = document.head.querySelector<HTMLScriptElement>(
    `script[data-ohc-schema="${id}"]`,
  );
  if (!node) {
    node = document.createElement("script");
    node.type = "application/ld+json";
    node.dataset.ohcSchema = id;
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(value);
}

export function applySeo({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = "website",
  schema,
  noindex = false,
}: PageHead) {
  document.title = title;
  setMeta("name", "description", description);
  setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
  setCanonical(`${SITE_ORIGIN}${path}`);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", type);
  setMeta("property", "og:url", `${SITE_ORIGIN}${path}`);
  setMeta("property", "og:image", image);
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", image);
  // A page without schema must not keep the previous page's (e.g. a Product).
  if (schema) setJsonLd("page", schema);
  else document.head.querySelector('script[data-ohc-schema="page"]')?.remove();
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The same head as applySeo(), as HTML for a page written at build time. */
export function renderHead({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  type = "website",
  schema,
  noindex = false,
  canonical = true,
}: PageHead) {
  const url = `${SITE_ORIGIN}${path}`;
  const meta = (attribute: string, key: string, content: string) =>
    `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  return [
    `<title>${escapeHtml(title)}</title>`,
    meta("name", "description", description),
    meta("name", "robots", noindex ? "noindex, nofollow" : "index, follow"),
    canonical ? `<link rel="canonical" href="${escapeHtml(url)}" />` : "",
    meta("property", "og:title", title),
    meta("property", "og:description", description),
    meta("property", "og:type", type),
    canonical ? meta("property", "og:url", url) : "",
    meta("property", "og:image", image),
    meta("property", "og:site_name", SITE_NAME),
    meta("property", "og:locale", "pt_BR"),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", title),
    meta("name", "twitter:description", description),
    meta("name", "twitter:image", image),
    // "<" is escaped so product text can never close the script element.
    schema
      ? `<script type="application/ld+json" data-ohc-schema="page">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`
      : "",
  ]
    .filter(Boolean)
    .join("\n    ");
}

/**
 * Swaps the generic head of index.html for a page's own. Everything between the
 * <!--seo:start--> and <!--seo:end--> markers is replaced; scripts, styles and
 * font preloads outside them are kept.
 */
export function injectHead(html: string, head: PageHead) {
  const start = html.indexOf("<!--seo:start-->");
  const end = html.indexOf("<!--seo:end-->");
  if (start < 0 || end < start)
    throw new Error("index.html sem marcadores SEO");
  return (
    html.slice(0, start + "<!--seo:start-->".length) +
    `\n    ${renderHead(head)}\n    ` +
    html.slice(end)
  );
}
