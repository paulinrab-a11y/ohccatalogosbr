/* Progresso real do scroll da seção (0 → 1) via GSAP ScrollTrigger pin + scrub, sem eventos wheel.
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
        pin: pinned.current,
        pinSpacing: false,
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
