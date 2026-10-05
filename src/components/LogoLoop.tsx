/* Ported from React Bits — LogoLoop (src/ts-tailwind/Animations/LogoLoop/LogoLoop.tsx)
   https://reactbits.dev/animations/logo-loop — MIT + Commons Clause © David Haz. Adapted: text items (car brands), pauses on hover, reduced-motion stops. */
import { useEffect, useRef, useState } from "react";
import { reduced } from "../lib/motion";
export default function LogoLoop({
  items,
  speed = 60,
  gap = 56,
  className = "",
}: {
  items: string[];
  speed?: number;
  gap?: number;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const pos = useRef(0);
  const paused = useRef(false);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const m = () => setW(el.scrollWidth / 2);
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);
  useEffect(() => {
    if (reduced() || !w) return;
    let raf = 0,
      last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      if (!paused.current) {
        pos.current -= speed * dt;
        if (pos.current <= -w) pos.current += w;
        if (track.current)
          track.current.style.transform = `translate3d(${pos.current}px,0,0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [w, speed]);
  const list = [...items, ...items];
  return (
    <div
      className={`overflow-hidden mask-[linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)] ${className}`}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      aria-label={`Marcas atendidas: ${items.join(", ")}`}
    >
      <div
        ref={track}
        className="flex w-max whitespace-nowrap will-change-transform"
        style={{ gap }}
      >
        {list.map((t, i) => (
          <span
            key={i}
            aria-hidden={i >= items.length}
            className="font-display text-[28px] sm:text-[40px] tracking-[0.08em] text-[#3A4350] flex items-center gap-[inherit]"
          >
            {t}
            <i className="inline-block h-1.5 w-1.5 rounded-full bg-ohc-red" />
          </span>
        ))}
      </div>
    </div>
  );
}
