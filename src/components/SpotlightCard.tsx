/* Ported from React Bits — SpotlightCard (src/ts-tailwind/Components/SpotlightCard/SpotlightCard.tsx)
   https://reactbits.dev/components/spotlight-card — MIT + Commons Clause © David Haz. Adapted: OHC blue spotlight, touch fallback (spotlight follows the last touch). */
import {
  useRef,
  type ReactNode,
  type MouseEvent,
  type TouchEvent,
} from "react";
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(59,123,255,.22)",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (x: number, y: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${x - r.left}px`);
    el.style.setProperty("--mouse-y", `${y - r.top}px`);
    el.style.setProperty("--spotlight-color", spotlightColor);
  };
  return (
    <div
      ref={ref}
      onMouseMove={(e: MouseEvent) => move(e.clientX, e.clientY)}
      onTouchStart={(e: TouchEvent) =>
        move(e.touches[0].clientX, e.touches[0].clientY)
      }
      className={`relative overflow-hidden rounded-xl border border-ohc-line bg-ohc-bg2 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100"
        style={{
          background:
            "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--spotlight-color, rgba(59,123,255,.22)), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
