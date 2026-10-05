/* Ported from React Bits — SplitText (src/ts-tailwind/TextAnimations/SplitText/SplitText.tsx), gsap version
   https://reactbits.dev/text-animations/split-text — MIT + Commons Clause © David Haz. Adapted: words/chars split, reduced-motion. */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { reduced } from "../lib/motion";
type Props = {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  splitType?: "chars" | "words";
  tag?: "h1" | "h2" | "p";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
};
export default function SplitText({
  text,
  className = "",
  delay = 40,
  duration = 0.9,
  splitType = "words",
  tag = "h2",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.2,
}: Props) {
  const ref = useRef<
    HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement
  >(null);
  const parts = splitType === "chars" ? text.split("") : text.split(" ");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>("[data-split]");
    if (reduced()) {
      targets.forEach((t) => (t.style.opacity = "1"));
      return;
    }
    gsap.set(targets, from);
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          gsap.to(targets, {
            ...to,
            duration,
            ease: "power3.out",
            stagger: delay / 1000,
          });
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text]);
  const Tag = tag;
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {parts.map((p, i) => (
        <span
          key={i}
          data-split
          className="inline-block max-w-full [overflow-wrap:anywhere] will-change-transform"
          aria-hidden="true"
        >
          {p}
          {splitType === "words" && i < parts.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}
