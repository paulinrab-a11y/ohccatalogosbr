/* Lives inside the Canvas so it unmounts with it. Draws the canvas only while something moves: the scroll progress, the mouse
   parallax, or the camera still easing toward its keyframe. Off screen or under
   the open mobile menu the canvas stops entirely. `kick` restarts drawing after
   events that change the picture without moving the inputs (model ready, resize). */
import { useEffect, type MutableRefObject } from "react";

// The camera/wheel lerps settle well within 1.5 s at 60 fps.
const SETTLE_FRAMES = 90;

export default function FrameGovernor({
  progress,
  mouse,
  kick,
  host,
  onMode,
}: {
  progress: MutableRefObject<number>;
  mouse: MutableRefObject<{ x: number; y: number }>;
  kick: MutableRefObject<number>;
  host: HTMLElement | null;
  /** The Canvas owns its frameloop prop; a re-render would undo a direct set. */
  onMode: (mode: "always" | "never") => void;
}) {
  useEffect(() => {
    let visible = true;
    let mode: "always" | "never" = "always";
    let still = 0;
    let last = "";
    const io = host
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        })
      : null;
    if (host) io?.observe(host);
    const onResize = () => {
      kick.current++;
    };
    addEventListener("resize", onResize);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = `${progress.current}|${mouse.current.x}|${mouse.current.y}|${kick.current}`;
      still = now === last ? still + 1 : 0;
      last = now;
      const menuOpen = document.body.classList.contains("menu-open");
      const next =
        visible && !menuOpen && still < SETTLE_FRAMES ? "always" : "never";
      if (next !== mode) {
        mode = next;
        onMode(next);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      removeEventListener("resize", onResize);
    };
  }, [host]);
  return null;
}
