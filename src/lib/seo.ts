import type { Product } from "./products";

const SITE_ORIGIN = "https://www.ohcmotorsbr.com.br";
const SITE_NAME = "OHC Motors";

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function productType(product: Product) {
  if (product.category === "Volantes") return "volante esportivo";
  if (product.category === "Grades") return "grade automotiva";
  if (product.category === "Faróis & Lanternas")
    return "farol ou lanterna automotiva";
  return "acessório automotivo";
}

export function productDescription(product: Product) {
  const type = productType(product);
  const finish = product.features.length
    ? ` com ${product.features.join(", ")}`
    : "";
  const application = product.application
    ? ` para aplicação ${product.application}`
    : "";
  const notes = product.notes ? ` ${clean(product.notes)}` : "";
  const compatibility = product.compat?.length
    ? ` Compatível com ${product.compat.slice(0, 5).join(", ")}.`
    : " Confirme a compatibilidade com o seu carro antes da compra.";
  return clean(
    `${product.name}: ${type}${finish}${application} fabricado pela OHC Motors. Consulte preço, prazo e instalação pelo WhatsApp.${compatibility}${notes}`,
  ).slice(0, 300);
}

export function productTitle(product: Product) {
  return clean(`${product.name} | ${SITE_NAME}`);
}

export function productUrl(product: Product) {
  return `${SITE_ORIGIN}/produto/${encodeURIComponent(product.slug)}`;
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
  schema,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  schema?: unknown;
  noindex?: boolean;
}) {
  document.title = title;
  setMeta("name", "description", description);
  setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
  setCanonical(`${SITE_ORIGIN}${path}`);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", "website");
  setMeta("property", "og:url", `${SITE_ORIGIN}${path}`);
  setMeta("property", "og:site_name", SITE_NAME);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  if (schema) setJsonLd("page", schema);
}

export function productSchema(product: Product) {
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
  const image = product.image ? `${SITE_ORIGIN}${product.image}` : undefined;
  if (image) schema.image = [image];
  if (product.price != null) {
    schema.offers = {
      "@type": "Offer",
      url: productUrl(product),
      priceCurrency: "BRL",
      price: product.price,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    };
  }
  return schema;
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/ohc-logo.webp`,
  areaServed: "BR",
  sameAs: ["https://www.instagram.com/ohcmotorsbr/"],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  inLanguage: "pt-BR",
};
