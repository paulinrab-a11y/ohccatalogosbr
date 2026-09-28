/* Ported from React Bits — BlurText (src/ts-tailwind/TextAnimations/BlurText/BlurText.tsx), motion version
   https://reactbits.dev/text-animations/blur-text — MIT + Commons Clause © David Haz. */
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { reduced } from "../lib/motion";
type Props = {
  text: string;
  className?: string;
  delay?: number;
  direction?: "top" | "bottom";
  tag?: "p" | "span" | "h2" | "h3";
};
export default function BlurText({
  text,
  className = "",
  delay = 60,
  direction = "top",
  tag = "p",
}: Props) {
  const [inView, setInView] = useState(reduced());
  const ref = useRef<
    HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement
  >(null);
  useEffect(() => {
    if (!ref.current || inView) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }),
      { threshold: 0.2 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const Tag = tag;
  const y = direction === "top" ? -20 : 20;
  return (
    <Tag ref={ref} className={`flex flex-wrap ${className}`} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block will-change-transform"
          initial={reduced() ? false : { filter: "blur(10px)", opacity: 0, y }}
          animate={
            inView ? { filter: "blur(0px)", opacity: 1, y: 0 } : undefined
          }
          transition={{
            duration: 0.6,
            delay: (i * delay) / 1000,
            ease: "easeOut",
          }}
        >
          {w}
          {i < text.split(" ").length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </Tag>
  );
}
