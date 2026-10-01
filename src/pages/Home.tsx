import { useEffect, useState, lazy, Suspense } from "react";
import Loader from "../components/Loader";
import Nav from "../components/Nav";
import LogoLoop from "../components/LogoLoop";
import CountUp from "../components/CountUp";
import BlurText from "../components/BlurText";
import SplitText from "../components/SplitText";
import ProductCard from "../components/ProductCard";
import SearchByCar from "../components/SearchByCar";
import FAQ from "../components/FAQ";
import Footer, { FinalCTA, FloatingWA } from "../components/Footer";
import SteeringExperience from "../components/SteeringExperience";
import { useProducts, brands } from "../lib/products";
import { applySeo, organizationSchema, websiteSchema } from "../lib/seo";
import { Link } from "../lib/router";
const LightRays = lazy(() => import("../components/LightRays"));
import AmbientLighting from "../components/AmbientLighting";
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
      description: "Volantes esportivos OHC Motors em couro, carbono e Alcântara, grades Mercedes com LED e acessórios automotivos. Consulte compatibilidade e atendimento pelo WhatsApp.",
      path: "/",
      schema: { "@context": "https://schema.org", "@graph": [organizationSchema, websiteSchema] },
    });
  }, []);
  const [ready, setReady] = useState(false);
  const [hot, setHot] = useState(0);
  const wheels = products.filter((p) => p.category === "Volantes"),
    grades = products.filter((p) => p.category === "Grades");
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
      <Loader ready={ready} />
      <AmbientLighting />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-70">
        <Suspense fallback={null}>
          <LightRays />
        </Suspense>
      </div>
      <div className="relative z-[1]">
        <Nav transparent />
        {/* Herói: experiência 3D do volante (GLB real), controlada pelo scroll */}
        <SteeringExperience onReady={() => setReady(true)} />
        <div className="border-y border-ohc-line bg-ohc-bg/60 py-4 backdrop-blur">
          <LogoLoop items={brands(products)} />
        </div>

        {/* Detalhes: BMW M3 Alcântara/Carbono com shift light, hotspots */}
        <div className="divider" />
        <section
          id="detalhes"
          className="wrap grid items-center gap-10 py-20 md:grid-cols-2 md:py-28"
        >
          <div className="order-1 md:order-2 relative mx-auto w-full max-w-[560px] aspect-square">
            <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,rgba(59,123,255,.16),transparent_70%)]" />
            <img
              src="/img/p/3.02.B02.00002.webp"
              alt="Volante OHC Motors BMW M3 em Alcântara e fibra de carbono com shift light"
              loading="lazy"
              className="relative h-full w-full object-contain [filter:drop-shadow(0_40px_60px_rgba(0,0,0,.6))]"
            />
            {HOTS.map(([t, , x, y], i) => (
              <button
                key={t}
                type="button"
                aria-label={t}
                onClick={() => setHot(i)}
                className="absolute -ml-3.5 -mt-3.5 h-7 w-7"
                style={{ left: x, top: y }}
              >
                <span
                  className={`absolute inset-0 rounded-full border border-ohc-glow/70 ${hot === i ? "animate-ping" : "opacity-0"}`}
                />
                <span
                  className={`absolute inset-2 rounded-full bg-ohc-glow shadow-[0_0_14px_#3B7BFF] transition-transform ${hot === i ? "scale-125" : ""}`}
                />
              </button>
            ))}
          </div>
          <div className="order-2 md:order-1">
            <p className="eyebrow">Detalhes</p>
            <SplitText
              text="Feito para a sua mão"
              className="mt-3 text-[clamp(44px,9vw,110px)] max-w-[9ch]"
            />
            <ol className="mt-6 max-w-[520px]">
              {HOTS.map(([t, d], i) => (
                <li
                  key={t}
                  className={`border-t border-ohc-line py-3 last:border-b cursor-pointer transition-colors ${hot === i ? "text-ohc-text" : "text-[#5B6572]"}`}
                  onClick={() => setHot(i)}
                >
                  <b
                    className={`block font-display text-[26px] md:text-[34px] font-normal tracking-wide transition-transform ${hot === i ? "translate-x-2.5" : ""}`}
                  >
                    {t}
                  </b>
                  <span
                    className={`block text-[13px] ${hot === i ? "text-ohc-steel" : "text-[#4A5461]"}`}
                  >
                    {d}
                  </span>
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
        <section className="border-y border-ohc-line bg-ohc-bg2/40 backdrop-blur-sm">
          <div className="wrap grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(([b, s], i) => (
              <div
                key={b}
                className={`border-l-2 pl-4 ${i % 2 ? "border-ohc-red" : "border-ohc-blue"}`}
              >
                <b className="block font-display text-2xl tracking-wide">{b}</b>
                <span className="text-sm text-ohc-steel">{s}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Catálogo + números */}
        <div className="divider" />
        <section id="catalogo" className="wrap py-20 md:py-28">
          <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="eyebrow">Catálogo</p>
              <SplitText
                text="O catálogo da OHC"
                className="mt-3 text-[clamp(40px,8vw,96px)]"
              />
            </div>
            <div className="flex gap-8">
              {[
                [wheels.length, "volantes"],
                [brands(products).length, "marcas"],
                [grades.length, "grades"],
              ].map(([n, l]) => (
                <div key={l as string}>
                  <CountUp
                    to={n as number}
                    className="block font-display text-[clamp(44px,6vw,80px)] leading-none"
                  />
                  <span className="text-[11px] tracking-[0.24em] uppercase text-ohc-steel">
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 snap-row md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-4 md:overflow-visible md:p-0 md:m-0 md:[&>*]:max-w-none md:[&>*]:flex-auto">
            {featured.map((p) => (
              <ProductCard key={p!.sku} p={p!} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/catalogo" className="btn btn-blue">
              Ver o catálogo completo
            </Link>
          </div>
        </section>

        {/* Busque pelo seu carro */}
        <section className="border-y border-ohc-line bg-ohc-bg2/40">
          <div className="wrap py-16 md:py-20">
            <div className="md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-center md:gap-12">
              <div>
                <p className="eyebrow">Busque pela sua marca</p>
                <BlurText
                  tag="h2"
                  text="Qual é a marca do seu carro?"
                  className="mt-3 text-[clamp(36px,8vw,64px)] md:text-[clamp(40px,4.6vw,72px)]"
                />
                <p className="mt-3 max-w-[48ch] text-ohc-steel">
                  Escolha a marca e veja o que temos no catálogo para ela.
                </p>
              </div>
              <div className="mt-8 md:mt-0">
                <SearchByCar />
              </div>
            </div>
          </div>
        </section>

        {/* Grades */}
        <section className="wrap grid items-center gap-10 py-20 md:grid-cols-2 md:py-28">
          <div className="relative">
            <div className="absolute inset-x-[-4%] top-[10%] bottom-[-20%] bg-[radial-gradient(60%_55%_at_50%_50%,rgba(59,123,255,.18),transparent_70%)]" />
            <img
              src="/img/grade.webp"
              alt="Grade Panamericana OHC Motors para Mercedes-Benz"
              loading="lazy"
              className="relative w-full [filter:drop-shadow(0_30px_50px_rgba(0,0,0,.7))]"
            />
          </div>
          <div>
            <p className="eyebrow">Grades</p>
            <SplitText
              text="Panamericana com LED"
              className="mt-3 text-[clamp(40px,8vw,96px)] max-w-[9ch]"
            />
            <p className="mt-5 max-w-[46ch] text-ohc-steel">
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
        <div className="divider" />
        <section>
          <div className="wrap py-20 md:py-28">
            <p className="eyebrow text-center">Perguntas frequentes</p>
            <BlurText
              tag="h2"
              text="O que os clientes perguntam"
              className="mt-3 justify-center text-center text-[clamp(38px,7vw,80px)]"
            />
            <div className="mt-10">
              <FAQ />
            </div>
          </div>
        </section>

        <FinalCTA />
        <Footer />
        <FloatingWA />
      </div>
    </>
  );
}
