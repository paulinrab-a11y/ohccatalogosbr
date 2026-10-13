/* Runs after `vite build`: writes one HTML file per public page with that page's
   own title, description, canonical, share image and JSON-LD, so link previews
   (WhatsApp, Instagram) and crawlers that do not run JavaScript see the right
   page. The app itself is unchanged; it boots from the same scripts.
   Products come from the live public catalog when the build has its key, and
   from the bundled list otherwise. Products added after a deploy still open
   through the SPA fallback until the next deploy. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { listPublicProducts } from "../server/publicCatalog.js";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProductShell from "../src/components/ProductShell";
import { defaultShareImage, productShareImage } from "./og-images";
import { dbToProduct, PRODUCTS, small, type Product } from "../src/lib/products";
import {
  catalogHead,
  compatibilityHead,
  homeHead,
  injectHead,
  productHead,
} from "../src/lib/seo";

const DIST = join(process.cwd(), "dist");
const template = readFileSync(join(DIST, "index.html"), "utf8");

async function loadProducts(): Promise<{ list: Product[]; source: string }> {
  try {
    const rows = await listPublicProducts();
    const list = rows
      .filter((row: { sku?: string }) => row.sku)
      .map((row: Parameters<typeof dbToProduct>[0]) => dbToProduct(row));
    if (list.length) return { list, source: "catálogo ao vivo" };
  } catch {
    /* no key in this build or catalog offline: fall back to the bundle */
  }
  return { list: PRODUCTS, source: "lista empacotada" };
}

function write(path: string, html: string) {
  const file = join(DIST, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

/* The product page HTML also carries a static first paint (photo, name) and the
   product data, so the photo, the page's largest element, shows before the app
   loads, and the app renders at once instead of waiting for the catalog. */
function productPage(product: Product, head: ReturnType<typeof productHead>) {
  const data = JSON.stringify({ ...product, price: null, promoPrice: null, cardPrice: null }).replace(/</g, "\\u003c");
  const preload = product.image
    ? `<link rel="preload" as="image" href="${product.image}" imagesrcset="${small(product.image)} 560w, ${product.image} 1000w" imagesizes="(min-width: 768px) 50vw, 100vw" fetchpriority="high" />
  </head>`
    : "</head>";
  return injectHead(template, head)
    .replace("</head>", preload)
    .replace(
      '<div id="root"></div>',
      `<div id="root">${renderToStaticMarkup(createElement(ProductShell, { p: product }))}</div>
    <script type="application/json" id="ohc-product">${data}</script>`,
    );
}

const { list, source } = await loadProducts();
await defaultShareImage(DIST);
// index.html is also the SPA fallback for other routes (vercel.json rewrites),
// so it carries the home text but no canonical; the app sets it on load.
write("index.html", injectHead(template, { ...homeHead, canonical: false }));
write("catalogo.html", injectHead(template, catalogHead(new URLSearchParams(), list)));
write("compatibilidade.html", injectHead(template, compatibilityHead));
let count = 0;
for (const product of list) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) continue;
  const share = await productShareImage(DIST, product.sku, product.image);
  // Prices and promotions change without a deploy, so the build-time HTML
  // carries no offer; the page adds the current one when it loads.
  const head = productHead({ ...product, price: null, promoPrice: null });
  if (share) head.image = `https://www.ohcmotorsbr.com.br${share}`;
  write(`produto/${product.slug}.html`, productPage(product, head));
  count++;
}
console.log(`prerender: ${count} produtos (${source}), início, catálogo e compatibilidade`);
