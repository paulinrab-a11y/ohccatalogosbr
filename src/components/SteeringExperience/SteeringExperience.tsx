/* Seção 3D "volante em destaque": pin + scrub via ScrollTrigger, Canvas lazy (monta ao se aproximar),
   loader elegante, fallback para imagem estática sem WebGL/erro, reduced-motion = cena estática com CTA. */
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./steeringExperience.css";
import { reportError } from "../../lib/observability";
import SteeringOverlay from "./SteeringOverlay";
import { useScrollProgress } from "./useScrollProgress";
import { hasWebGL, isTouch, prefersReduced, useIsMobile } from "./useMedia";
import { SECTION_VH } from "./timeline";
const SteeringScene = lazy(() => import("./SteeringScene"));
class Boundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    reportError(error, "3d");
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
/* O three.js e o GLB pesam vários segundos de CPU no celular. Esperar o load da
   página e um momento ocioso deixa o texto e o resto do herói aparecerem antes. */
function useAfterLoad() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    let cancel = () => {};
    const go = () => {
      if (typeof requestIdleCallback === "function") {
        const id = requestIdleCallback(() => setDone(true), { timeout: 1500 });
        cancel = () => cancelIdleCallback(id);
      } else {
        const id = setTimeout(() => setDone(true), 300);
        cancel = () => clearTimeout(id);
      }
    };
    if (document.readyState === "complete") go();
    else addEventListener("load", go, { once: true });
    return () => {
      removeEventListener("load", go);
      cancel();
    };
  }, []);
  return done;
}
export default function SteeringExperience({
  onReady,
}: {
  onReady?: () => void;
}) {
  const section = useRef<HTMLElement>(null),
    pinned = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  const reduced = prefersReduced();
  const [near, setNear] = useState(false);
  const idle = useAfterLoad();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(() => !hasWebGL());
  const mouse = useRef({ x: 0, y: 0 });
  const progress = useScrollProgress(section, pinned, !reduced && !failed);
  /* lazy: só monta o WebGL quando a seção está a ~600 px do viewport */
  useEffect(() => {
    if (!section.current || failed) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(section.current);
    return () => io.disconnect();
  }, [failed]);
  useEffect(() => {
    if (!near || ready || failed) return;
    const timer = setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(timer);
  }, [near, ready, failed]);
  /* parallax de mouse (desktop apenas) */
  useEffect(() => {
    if (isTouch()) return;
    const on = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / innerHeight - 0.5) * 2;
    };
    addEventListener("mousemove", on, { passive: true });
    return () => removeEventListener("mousemove", on);
  }, []);
  useEffect(() => {
    if (reduced) progress.current = 1;
  }, [reduced]);
  /* avisa o loader da página: modelo pronto, ou fallback, ou teto de 6 s */
  useEffect(() => {
    if (ready || failed) onReady && onReady();
  }, [ready, failed]);
  useEffect(() => {
    const t = setTimeout(() => onReady && onReady(), 6000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (reduced || failed) onReady && onReady();
  }, []);
  return (
    <section
      ref={section}
      className="se-section"
      style={{ height: reduced || failed ? "auto" : `${SECTION_VH}vh` }}
      aria-label="Apresentação 3D do volante OHC"
    >
      <div ref={pinned} className="se-pin">
        {failed ? (
          <div className="se-fallback">
            <img
              src="/img/volante-frente.webp"
              alt="Volante OHC Motors em fibra de carbono e Alcântara com shift light"
              width={1100}
              height={1000}
              fetchPriority="high"
            />
          </div>
        ) : near && idle ? (
          <div className="se-canvas">
            <Boundary onError={() => setFailed(true)}>
              <Suspense fallback={null}>
                <SteeringScene
                  progress={progress}
                  mouse={mouse}
                  mobile={mobile}
                  onReady={() => setReady(true)}
                  onError={() => setFailed(true)}
                />
              </Suspense>
            </Boundary>
          </div>
        ) : null}
        <div className="se-vignette" />
        {!failed && !ready && (
          <div
            className="se-loader"
            style={{ opacity: ready ? 0 : 1 }}
            aria-live="polite"
          >
            <div className="ub-dots">
              <i />
              <i />
              <i />
            </div>
            <span>Carregando o volante 3D…</span>
          </div>
        )}
        <SteeringOverlay progress={progress} staticMode={reduced || failed} />
      </div>
    </section>
  );
}
