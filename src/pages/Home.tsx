import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import ProductCard from "../components/ProductCard";
import CarPicker from "../components/CarPicker";
import FAQ from "../components/FAQ";
import Footer, { FinalCTA, FloatingWA } from "../components/Footer";
import SteeringExperience from "../components/SteeringExperience";
import { useProducts, brands } from "../lib/products";
import { applySeo, organizationSchema, websiteSchema } from "../lib/seo";
import { Link } from "../lib/router";
const TRUST = [
  ["PIX com desconto", "ou até 12x no cartão via InfinitePay"],
  ["90 dias de garantia", "contra defeito de fabricação"],
  ["7 dias", "para arrependimento, conforme o CDC"],
  ["Original OHC", "volantes fabricados pela OHC Motors"],
];
const HOTS = [
  [
    "Shift light",
    "display de rotação e velocidade no topo do aro, com LEDs de troca",
    "50%",
    "8%",
  ],
  [
    "Alcântara",
    "pegadas laterais em Alcântara, com mais aderência para as mãos",
    "10%",
    "46%",
  ],
  [
    "Fibra de carbono",
    "trama real envernizada no aro e nos raios",
    "29%",
    "14%",
  ],
  [
    "Costura M tricolor",
    "costura de contorno nas três cores da linha M",
    "80%",
    "36%",
  ],
];
export default function Home() {
  const products = useProducts();
  useEffect(() => {
    applySeo({
      title: "OHC Motors | Volantes esportivos e acessórios automotivos",
      description:
        "Volantes esportivos OHC Motors em couro, carbono e Alcântara, grades Mercedes com LED e acessórios automotivos. Consulte compatibilidade e atendimento pelo WhatsApp.",
      path: "/",
      schema: {
        "@context": "https://schema.org",
        "@graph": [organizationSchema, websiteSchema],
      },
    });
  }, []);
  const [hot, setHot] = useState(0);
  const brandList = brands(products);
  const countOf = (b: string) => products.filter((p) => p.brand === b).length;
  const featured = [
    "3.02.B02.00002",
    "1.02.B02.00008",
    "3.02.B08.00155",
    "1.02.B01.00075",
    "1.02.D01.00009",
    "3.02.A01.00109",
    "1.02.B01.00046",
    "1.02.B02.00040",
  ]
    .map((s) => products.find((p) => p.sku === s))
    .filter(Boolean);
  return (
    <>
      <div className="relative">
        <Nav transparent />
        {/* Herói: experiência 3D do volante (GLB real), controlada pelo scroll */}
        <SteeringExperience />

        {/* Marcas: lista estática com a contagem real de cada uma no catálogo */}
        <section
          aria-labelledby="marcas"
          className="border-y border-ohc-line bg-ohc-bg2"
        >
          <div className="wrap py-14 md:py-20">
            <h2 id="marcas" className="text-[clamp(40px,8vw,72px)]">
              {products.length} produtos para {brandList.length} marcas
            </h2>
            <ul className="mt-8 flex flex-wrap gap-2">
              {brandList.map((b) => (
                <li key={b}>
                  <Link
                    href={`/catalogo?marca=${encodeURIComponent(b)}`}
                    className="chip"
                  >
                    {b}
                    <small>{countOf(b)}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Detalhes: BMW M3 Alcântara/Carbono com shift light, hotspots */}
        <section
          id="detalhes"
          className="wrap grid items-center gap-10 py-20 md:grid-cols-2 md:py-32"
        >
          <div className="order-1 md:order-2 relative mx-auto w-full max-w-[560px] aspect-square">
            <img
              src="/img/p/3.02.B02.00002.webp"
              alt="Volante OHC Motors BMW M3 em Alcântara e fibra de carbono com shift light"
              loading="lazy"
              width={1000}
              height={1000}
              className="relative h-full w-full object-contain"
            />
            {HOTS.map(([t, , x, y], i) => (
              <button
                key={t}
                type="button"
                aria-label={t}
                aria-pressed={hot === i}
                onClick={() => setHot(i)}
                className="absolute -ml-3.5 -mt-3.5 h-7 w-7"
                style={{ left: x, top: y }}
              >
                <span
                  className={`absolute inset-1 rounded-full border-2 transition-colors ${hot === i ? "border-white bg-ohc-red" : "border-white/80 bg-ohc-blue"}`}
                />
              </button>
            ))}
          </div>
          <div className="order-2 md:order-1">
            <h2 className="text-[clamp(44px,9vw,104px)] max-w-[9ch]">
              Feito para a sua mão
            </h2>
            <ol className="mt-6 max-w-[520px]">
              {HOTS.map(([t, d], i) => (
                <li
                  key={t}
                  className={`border-t border-ohc-line last:border-b transition-colors ${hot === i ? "text-ohc-text" : "text-[#8b95a3]"}`}
                >
                  {/* A real button: keyboard users can pick a detail too. */}
                  <button
                    type="button"
                    aria-pressed={hot === i}
                    onClick={() => setHot(i)}
                    className="block w-full py-3 text-left"
                  >
                    <b
                      className={`block font-display text-[26px] md:text-[34px] font-normal tracking-wide transition-transform ${hot === i ? "translate-x-2.5" : ""}`}
                    >
                      {t}
                    </b>
                    <span
                      className={`block text-[13px] ${hot === i ? "text-[#c9d0d8]" : "text-[#8b95a3]"}`}
                    >
                      {d}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <Link
              href="/catalogo?categoria=Volantes"
              className="btn btn-blue mt-7"
            >
              Ver os volantes
            </Link>
          </div>
        </section>

        {/* Confiança */}
        <section
          aria-label="Condições de compra"
          className="wrap pb-20 md:pb-28"
        >
          <dl className="plate [--cells:1] sm:[--cells:2] lg:[--cells:4]">
            {TRUST.map(([b, s]) => (
              <div key={b} className="py-4!">
                <dt className="font-display! text-[26px]! leading-none tracking-wide text-ohc-text!">
                  {b}
                </dt>
                <dd className="mt-1.5! text-sm! font-medium! text-[#c9d0d8]!">
                  {s}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Catálogo + números */}
        <section id="catalogo" className="wrap py-20 md:py-32">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-[clamp(40px,8vw,88px)]">Em destaque</h2>
            <Link
              href="/catalogo"
              className="text-sm font-bold text-[#afc8ff] underline underline-offset-4 hover:text-white"
            >
              Ver o catálogo completo
            </Link>
          </div>
          <div className="mt-10 snap-row md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-4 md:overflow-visible md:p-0 md:m-0 md:*:max-w-none md:*:flex-auto">
            {featured.map((p) => (
              <ProductCard key={p!.sku} p={p!} />
            ))}
          </div>
        </section>

        {/* Busque pelo seu carro */}
        <section className="border-y border-ohc-line bg-ohc-bg2">
          <div className="wrap grid gap-8 py-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:gap-12 md:py-24">
            <div>
              <h2 className="text-[clamp(36px,8vw,64px)] md:text-[clamp(40px,4.6vw,72px)]">
                Busque pelo modelo ou chassi
              </h2>
              <p className="mt-3 max-w-[48ch] text-[#c9d0d8]">
                Escreva o modelo (M3, Mustang, Classe C) ou o código do chassi
                (F30, W205). O site guarda o seu carro para a próxima visita.
              </p>
            </div>
            <CarPicker />
          </div>
        </section>

        {/* Grades */}
        <section className="wrap grid items-center gap-10 py-20 md:grid-cols-2 md:py-28">
          <div className="relative">
            <img
              src="/img/grade.webp"
              alt="Grade Panamericana OHC Motors para Mercedes-Benz"
              loading="lazy"
              width={1540}
              height={425}
              className="relative h-auto w-full"
            />
          </div>
          <div>
            <h2 className="text-[clamp(36px,7vw,64px)] md:text-[clamp(34px,4vw,56px)]">
              Grade Panamericana com LED
            </h2>
            <p className="mt-5 max-w-[46ch] text-[#c9d0d8]">
              Grades para Mercedes-Benz com LED apenas no contorno lateral; anel
              e estrela não acendem. Há versões para Classe A W177, Classe C
              W205 e W206 e GLC X253 e X254. A partir de R$ 1.500.
            </p>
            <Link
              href="/catalogo?categoria=Grades"
              className="btn btn-blue mt-7"
            >
              Ver as grades
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-ohc-line">
          <div className="wrap grid gap-10 py-20 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:py-32">
            <h2 className="text-[clamp(38px,7vw,72px)] max-w-[10ch]">
              Perguntas frequentes
            </h2>
            <FAQ />
          </div>
        </section>

        <FinalCTA />
        <Footer />
        <FloatingWA afterHero />
      </div>
    </>
  );
}
