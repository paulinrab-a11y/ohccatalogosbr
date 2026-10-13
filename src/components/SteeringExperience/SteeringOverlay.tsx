/* Textos e CTA sobre o 3D; opacidade calculada no rAF a partir do progresso (sem setState por frame). */
import {
  useEffect,
  useRef,
  type MutableRefObject,
  type RefObject,
} from "react";
import { COPY, OUTRO } from "./timeline";
import { Link } from "../../lib/router";
import CarPicker from "../CarPicker";
export default function SteeringOverlay({
  progress,
  staticMode = false,
  band,
}: {
  progress: MutableRefObject<number>;
  staticMode?: boolean;
  /** Desktop stripe drawn behind the canvas; it fades with the opening. */
  band?: RefObject<HTMLDivElement | null>;
}) {
  const items = useRef<HTMLDivElement[]>([]);
  const outro = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (staticMode) return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const p = progress.current;
      COPY.forEach(([a, b], i) => {
        const el = items.current[i];
        if (!el) return;
        const inT = Math.min(1, Math.max(0, (p - a) / 0.05)),
          outT = Math.min(1, Math.max(0, (b - p) / 0.05));
        const o = Math.min(inT, outT);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 14}px)`;
        el.style.visibility = o > 0.01 ? "visible" : "hidden";
      });
      if (outro.current) {
        const o = Math.min(1, Math.max(0, (p - OUTRO.start) / 0.08));
        outro.current.style.opacity = String(o);
        outro.current.style.visibility = o > 0.01 ? "visible" : "hidden";
        outro.current.style.pointerEvents = o > 0.5 ? "auto" : "none";
      }
      if (intro.current) {
        const o = Math.min(1, Math.max(0, (0.1 - p) / 0.06));
        intro.current.style.opacity = String(o);
        intro.current.style.pointerEvents = o > 0.5 ? "auto" : "none";
        intro.current.style.visibility = o > 0.01 ? "visible" : "hidden";
        if (band?.current) band.current.style.opacity = String(o);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [staticMode]);
  return (
    <div className="pointer-events-none absolute inset-0 z-3">
      {/* Abertura (0 a 10%): a faixa da pintura cruza a tela com o título pintado
          nela, e logo abaixo o campo do carro já funciona. */}
      <div
        ref={intro}
        className={`absolute inset-x-0 ${staticMode ? "top-[52svh]" : "bottom-[calc(14px+env(safe-area-inset-bottom))] sm:bottom-[7vh]"} pointer-events-auto lg:top-[42svh] lg:bottom-auto`}
      >
        <div className="relative">
          <div
            aria-hidden="true"
            className="livery livery-skew livery-paint absolute -inset-x-8 -top-3 -bottom-4 sm:-bottom-6 lg:hidden"
          />
          <h1 className="livery-skew relative px-5 py-1 text-[clamp(54px,15.5vw,76px)] leading-[0.86] text-white sm:px-12 sm:text-[clamp(72px,8.4vw,132px)]">
            O volante
            <br />
            do seu carro
          </h1>
        </div>
        <div className="wrap mt-7 grid gap-4 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-end">
          <p className="hidden max-w-[44ch] text-base text-[#c9d0d8] lg:block">
            Volantes em couro, carbono ou Alcântara, de fabricação própria. A
            equipe confirma a aplicação no seu carro antes de enviar, para todo
            o Brasil.
          </p>
          <CarPicker compact />
        </div>
      </div>
      {COPY.map(([, , t, s], i) => (
        <div
          key={t}
          ref={(el) => {
            if (el) items.current[i] = el;
          }}
          className={`absolute left-5 right-5 bottom-[12svh] sm:left-12 sm:right-auto sm:bottom-[14vh] max-w-[38ch] ${staticMode ? "hidden" : "opacity-0"}`}
        >
          <h3 className="font-display text-[clamp(30px,7vw,64px)] leading-none">
            {t}
          </h3>
          <p className="mt-2 text-[13px] sm:text-sm text-ohc-steel">{s}</p>
        </div>
      ))}
      <div
        ref={outro}
        className={`absolute inset-x-5 bottom-[10svh] sm:inset-x-12 sm:bottom-[12vh] flex flex-col items-start gap-4 ${staticMode ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
      >
        <h3 className="font-display leading-none text-[clamp(44px,10vw,110px)]">
          Feito pela OHC
        </h3>
        <Link href="/catalogo?categoria=Volantes" className="btn btn-blue">
          Ver volantes
        </Link>
      </div>
    </div>
  );
}
