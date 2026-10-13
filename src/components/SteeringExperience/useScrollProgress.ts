/* Progresso real do scroll da seção (0 → 1) via GSAP ScrollTrigger, sem eventos wheel.
   A seção fica presa por CSS (position: sticky); sem pin por JS, não há salto ao soltar.
   O valor vai para uma ref (lido no render loop), nunca para setState a 60 fps. */
import { useEffect, useRef, type RefObject } from "react";
export function useScrollProgress(
  section: RefObject<HTMLElement>,
  pinned: RefObject<HTMLElement>,
  enabled: boolean,
) {
  const progress = useRef(0);
  useEffect(() => {
    if (!enabled || !section.current || !pinned.current) return;
    let st: import("gsap/ScrollTrigger").ScrollTrigger | undefined;
    let refresh = () => {};
    let alive = true;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!alive) return;
      gsap.registerPlugin(ScrollTrigger);
      refresh = () => ScrollTrigger.refresh();
      st = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress.current = self.progress;
        },
      });
      requestAnimationFrame(() => ScrollTrigger.refresh());
    })();
    const onResize = () => {
      try {
        refresh();
      } catch {}
    };
    addEventListener("orientationchange", onResize);
    return () => {
      alive = false;
      removeEventListener("orientationchange", onResize);
      try {
        st?.kill();
      } catch {}
    };
  }, [enabled]);
  return progress;
}
