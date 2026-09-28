/* Timeline da experiência 3D: keyframes por progresso do scroll (0 → 1).
   Para mudar câmera, rotação, textos ou duração das fases, edite AQUI. */
export type Key = {
  p: number;
  cam: [number, number, number];
  look: [number, number, number];
  rotY: number;
  rotX: number;
  scale: number;
  light: number;
};
/* Desktop: enquadramentos mais laterais. Unidades em metros (o aro tem 0,38 m de largura). */
export const KEYS_DESKTOP: Key[] = [
  {
    p: 0.0,
    cam: [-0.14, -0.02, 1.28],
    look: [-0.14, 0, 0],
    rotY: -0.14,
    rotX: 0.02,
    scale: 0.94,
    light: 0.9,
  },
  {
    p: 0.1,
    cam: [-0.14, 0.0, 1.18],
    look: [-0.14, 0, 0],
    rotY: -0.14,
    rotX: 0.02,
    scale: 1.0,
    light: 1,
  },
  {
    p: 0.3,
    cam: [0.18, 0.06, 1.02],
    look: [0, 0, 0],
    rotY: -0.95,
    rotX: 0.05,
    scale: 1.0,
    light: 1,
  },
  {
    p: 0.48,
    cam: [0.14, 0.15, 0.4],
    look: [0.1, 0.12, 0.0],
    rotY: -0.35,
    rotX: 0.05,
    scale: 1.0,
    light: 1,
  },
  {
    p: 0.65,
    cam: [0.34, 0.03, 0.52],
    look: [0.09, -0.01, -0.02],
    rotY: -0.7,
    rotX: 0.0,
    scale: 1.0,
    light: 1,
  },
  {
    p: 0.82,
    cam: [0.0, 0.21, 0.4],
    look: [0, 0.165, 0.02],
    rotY: 0.0,
    rotX: 0.28,
    scale: 1.0,
    light: 1,
  },
  {
    p: 1.0,
    cam: [0.0, 0.0, 1.18],
    look: [0, 0, 0],
    rotY: 0.0,
    rotX: 0.0,
    scale: 1.0,
    light: 1,
  },
];
/* Mobile: volante centralizado, câmera mais afastada, produto nunca cortado. */
export const KEYS_MOBILE: Key[] = [
  {
    p: 0.0,
    cam: [0.0, -0.16, 1.62],
    look: [0, -0.14, 0],
    rotY: -0.1,
    rotX: 0.02,
    scale: 0.94,
    light: 0.9,
  },
  {
    p: 0.1,
    cam: [0.0, -0.14, 1.52],
    look: [0, -0.12, 0],
    rotY: -0.1,
    rotX: 0.02,
    scale: 1.0,
    light: 1,
  },
  {
    p: 0.3,
    cam: [0.06, 0.04, 1.3],
    look: [0, 0, 0],
    rotY: -0.85,
    rotX: 0.05,
    scale: 1.0,
    light: 1,
  },
  {
    p: 0.48,
    cam: [0.06, 0.14, 0.6],
    look: [0.09, 0.12, 0.0],
    rotY: -0.3,
    rotX: 0.05,
    scale: 1.0,
    light: 1,
  },
  {
    p: 0.65,
    cam: [0.2, 0.02, 0.75],
    look: [0.08, -0.01, -0.02],
    rotY: -0.65,
    rotX: 0.0,
    scale: 1.0,
    light: 1,
  },
  {
    p: 0.82,
    cam: [0.0, 0.2, 0.58],
    look: [0, 0.165, 0.02],
    rotY: 0.0,
    rotX: 0.28,
    scale: 1.0,
    light: 1,
  },
  {
    p: 1.0,
    cam: [0.0, 0.0, 1.5],
    look: [0, 0, 0],
    rotY: 0.0,
    rotX: 0.0,
    scale: 1.0,
    light: 1,
  },
];
/* Textos: [início, fim, título, subtítulo] em progresso 0..1 */
export const COPY: [number, number, string, string][] = [
  [
    0.12,
    0.3,
    "CARBONO E COURO",
    "Fabricação própria em São Paulo. A aplicação é confirmada antes do envio.",
  ],
  [
    0.32,
    0.47,
    "ACABAMENTO",
    "Trama de carbono real envernizada, com couro perfurado nas pegadas.",
  ],
  [
    0.5,
    0.64,
    "PADDLE SHIFT",
    "Borboletas em alumínio acetinado, com curso curto.",
  ],
  [
    0.67,
    0.81,
    "SHIFT LIGHT",
    "LEDs de troca no topo do aro. Acendem do azul ao vermelho conforme a rotação sobe.",
  ],
];
/* Fases especiais */
export const PADDLE = { start: 0.53, end: 0.62 }; // puxa e solta a borboleta
export const SHIFT = { start: 0.66, end: 0.8 }; // LEDs acendem progressivamente
export const OUTRO = { start: 0.86 }; // "OHC MOTORS" + CTA
/* Altura da seção (vh). Mais alto = animação mais lenta no scroll. */
export const SECTION_VH = 350;
export const smooth = (t: number) => t * t * (3 - 2 * t);
export function sample(keys: Key[], p: number): Key {
  if (p <= keys[0].p) return keys[0];
  if (p >= keys[keys.length - 1].p) return keys[keys.length - 1];
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].p) i++;
  const a = keys[i],
    b = keys[i + 1],
    t = smooth((p - a.p) / (b.p - a.p));
  const L = (x: number, y: number) => x + (y - x) * t;
  return {
    p,
    cam: [L(a.cam[0], b.cam[0]), L(a.cam[1], b.cam[1]), L(a.cam[2], b.cam[2])],
    look: [
      L(a.look[0], b.look[0]),
      L(a.look[1], b.look[1]),
      L(a.look[2], b.look[2]),
    ],
    rotY: L(a.rotY, b.rotY),
    rotX: L(a.rotX, b.rotX),
    scale: L(a.scale, b.scale),
    light: L(a.light, b.light),
  };
}
