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
import LiveryTitle from "../LiveryTitle";

export const HERO: [string, string] = ["O volante", "do seu carro"];
export const HERO_SIZE = "text-[clamp(72px,8vw,128px)]";
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
        className={`absolute inset-x-0 ${staticMode ? "top-[52svh]" : "bottom-[calc(6px+env(safe-area-inset-bottom))] sm:bottom-[5vh]"} pointer-events-auto lg:top-[28svh] lg:bottom-auto`}
      >
        {/* Phones: stripe and lettering together. Wide screens: lettering only,
            over the stripe drawn behind the canvas at the same position. */}
        <LiveryTitle
          lines={HERO}
          paint="lg-text"
          className="-my-[3vw] livery-paint lg:my-0 lg:animate-none"
          titleClass="text-[clamp(48px,14vw,72px)] lg:text-[clamp(72px,8vw,128px)]"
        />
        <div className="wrap mt-3 grid gap-3 lg:mt-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-start">
          <p className="hidden max-w-[44ch] text-base text-[#c9d0d8] lg:block">
            Volantes em couro, carbono ou Alcântara, de fabricação própria. A
            equipe confirma a aplicação no seu carro antes de enviar, para todo
            o Brasil.
          </p>
          <div>
            <CarPicker compact />
            <Link
              href="/catalogo"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-[#afc8ff] underline underline-offset-4 hover:text-white"
            >
              Ou veja o catálogo completo
            </Link>
          </div>
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
