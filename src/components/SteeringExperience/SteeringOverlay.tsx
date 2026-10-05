/* Textos e CTA sobre o 3D; opacidade calculada no rAF a partir do progresso (sem setState por frame). */
import { useEffect, useRef, type MutableRefObject } from "react";
import { COPY, OUTRO } from "./timeline";
import { Link } from "../../lib/router";
import DecryptedText from "../DecryptedText";
export default function SteeringOverlay({
  progress,
  staticMode = false,
}: {
  progress: MutableRefObject<number>;
  staticMode?: boolean;
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
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [staticMode]);
  return (
    <div className="pointer-events-none absolute inset-0 z-3">
      {/* Abertura (0 a 10%): título do herói sobre o 3D; em modo estático fica fixo */}
      <div
        ref={intro}
        className={`absolute left-5 right-5 sm:left-12 sm:right-auto ${staticMode ? "top-[14svh]" : "bottom-[12svh] sm:bottom-[14vh]"} max-w-[640px] pointer-events-auto`}
      >
        <p className="eyebrow mb-3 flex items-center gap-3">
          <span className="inline-block h-px w-9 bg-ohc-glow" />
          <DecryptedText text="Fabricação própria · São Paulo" speed={30} />
        </p>
        <h1 className="text-[clamp(44px,11vw,64px)] sm:text-[clamp(56px,7.5vw,120px)] leading-[0.92] max-w-[11ch] [text-shadow:0_20px_60px_rgba(0,0,0,.85)]">
          <DecryptedText
            text="O volante certo para o seu carro."
            speed={38}
            characters="OHCMTRS0123456789#"
            encryptedClassName="text-ohc-glow/80"
          />
        </h1>
        <p className="mt-4 max-w-[44ch] text-[14px] sm:text-base text-ohc-steel">
          Volantes em couro, carbono ou Alcântara. A equipe confirma a aplicação
          no seu carro antes de enviar, para todo o Brasil.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/catalogo" className="btn btn-blue">
            Ver catálogo
          </Link>
          <span className="hidden sm:inline-flex items-center text-[11px] tracking-[0.3em] uppercase text-ohc-steel">
            Role para explorar
          </span>
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
          <span className="text-ohc-blue">OHC</span>{" "}
          <span className="text-ohc-red">MOTORS</span>
        </h3>
        <Link href="/catalogo?categoria=Volantes" className="btn btn-blue">
          Ver volantes
        </Link>
      </div>
    </div>
  );
}
