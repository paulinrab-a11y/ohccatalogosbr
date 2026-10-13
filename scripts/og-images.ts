/* Share images (1200×630 JPG) for link previews: WhatsApp and Instagram do not
   reliably show WebP. Built from the real product photo on the site's ground,
   with the livery stripe along the bottom; nothing is drawn over the product. */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const W = 1200;
const H = 630;
const BG = "#0b0d11";
// The livery module: blue, white hairline, red, skewed like the site's stripe.
const STRIPE = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <g transform="skewY(-4) translate(0 ${H - 30})">
      <rect x="0" y="0" width="${W}" height="34" fill="#214fa1"/>
      <rect x="0" y="34" width="${W}" height="5" fill="#eef1f4"/>
      <rect x="0" y="39" width="${W}" height="40" fill="#ed1c24"/>
    </g>
  </svg>`,
);

async function photoBuffer(src: string, dist: string) {
  if (/^https?:\/\//i.test(src)) {
    const response = await fetch(src, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`foto ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
  const file = join(dist, src.replace(/^\//, ""));
  if (!existsSync(file)) throw new Error("foto ausente");
  return readFileSync(file);
}

/** Writes dist/og/p/<sku>.jpg; returns its site path, or null if it could not. */
export async function productShareImage(
  dist: string,
  sku: string,
  src: string | null,
) {
  if (!src) return null;
  try {
    const photo = await sharp(await photoBuffer(src, dist))
      .resize({ width: 820, height: 520, fit: "contain", background: BG })
      .toBuffer();
    const path = `/og/p/${sku.replace(/[^a-zA-Z0-9.]+/g, "-")}.jpg`;
    const out = join(dist, path.slice(1));
    mkdirSync(dirname(out), { recursive: true });
    await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
      .composite([
        { input: photo, top: 30, left: (W - 820) / 2 },
        { input: STRIPE, top: 0, left: 0 },
      ])
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(out);
    return path;
  } catch {
    return null;
  }
}

/** The default share image: logo and the featured BMW M3 wheel (a cut-out on
    black, so it sits on the ground without a box) above the stripe. */
export async function defaultShareImage(dist: string) {
  const logo = await sharp(readFileSync(join(dist, "ohc-logo.webp")))
    .resize({ width: 420 })
    .toBuffer();
  const wheel = await sharp(readFileSync(join(dist, "img/p/3.02.B02.00002.webp")))
    .resize({ width: 560, height: 520, fit: "contain", background: BG })
    .toBuffer();
  const out = join(dist, "og/ohc-motors.jpg");
  mkdirSync(dirname(out), { recursive: true });
  await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
    .composite([
      { input: wheel, top: 20, left: 600 },
      { input: STRIPE, top: 0, left: 0 },
      { input: logo, top: 210, left: 80 },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);
}
