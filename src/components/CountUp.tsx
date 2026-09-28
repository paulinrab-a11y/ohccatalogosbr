/* Ported from React Bits — CountUp (src/ts-tailwind/TextAnimations/CountUp/CountUp.tsx), motion springs
   https://reactbits.dev/text-animations/count-up — MIT + Commons Clause © David Haz. */
import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";
import { reduced } from "../lib/motion";
type Props = {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  separator?: string;
};
export default function CountUp({
  to,
  from = 0,
  duration = 1.6,
  className = "",
  separator = ".",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(from);
  const damping = 20 + 40 * (1 / duration),
    stiffness = 100 * (1 / duration);
  const spring = useSpring(mv, { damping, stiffness });
  const inView = useInView(ref, { once: true, margin: "0px" });
  useEffect(() => {
    if (ref.current) ref.current.textContent = String(from);
  }, [from]);
  useEffect(() => {
    if (inView) {
      if (reduced()) {
        if (ref.current) ref.current.textContent = String(to);
      } else mv.set(to);
    }
  }, [inView, to]);
  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current)
          ref.current.textContent = Math.round(v)
            .toLocaleString("pt-BR")
            .replace(/,/g, separator);
      }),
    [spring],
  );
  return <span ref={ref} className={className} />;
}
