/* Meta Pixel. Loads only when VITE_META_PIXEL_ID is set at build time; without
   it every call is a no-op and the site works the same. No personal data is
   sent: product code, price and currency only. */
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: Fbq;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const PIXEL_ID = String(import.meta.env.VITE_META_PIXEL_ID || "").trim();
let started = false;

export const pixelEnabled = () => /^\d{6,20}$/.test(PIXEL_ID);

/** Same bootstrap as Meta's snippet, written as code so the CSP needs no inline script. */
function startPixel() {
  if (started || !pixelEnabled() || typeof window === "undefined") return;
  started = true;
  const fbq = function (this: unknown, ...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", PIXEL_ID);
}

export function track(
  event: "PageView" | "ViewContent" | "Contact",
  params?: Record<string, unknown>,
) {
  if (!pixelEnabled()) return;
  startPixel();
  window.fbq?.("track", event, params);
}

/** Parameters Meta expects for a product: code, type, value and currency. */
export const productParams = (sku: string, value: number | null) => ({
  content_ids: [sku],
  content_type: "product",
  ...(value != null ? { value, currency: "BRL" } : {}),
});
