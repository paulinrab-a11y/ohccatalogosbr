/* Ported from React Bits — DecryptedText (src/ts-tailwind/TextAnimations/DecryptedText/DecryptedText.tsx)
   https://reactbits.dev/text-animations/decrypted-text — MIT + Commons Clause © David Haz. Adapted: OHC colors, reduced-motion. */
import { useEffect, useRef, useState } from "react";
import { reduced } from "../lib/motion";
type Props = {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover" | "mount";
  onDone?: () => void;
};
export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 12,
  sequential = true,
  revealDirection = "start",
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&",
  className = "",
  encryptedClassName = "text-ohc-glow",
  animateOn = "mount",
  onDone,
}: Props) {
  const [display, setDisplay] = useState(reduced() ? text : "");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [active, setActive] = useState(animateOn === "mount");
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (animateOn !== "view" || !ref.current) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(true)),
      { threshold: 0.2 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [animateOn]);
  useEffect(() => {
    if (!active) return;
    if (reduced()) {
      setDisplay(text);
      onDone && onDone();
      return;
    }
    let iter = 0;
    const rev = new Set<number>();
    const chars = characters.split("");
    const next = () => {
      const n = text.length;
      if (revealDirection === "start") return rev.size;
      if (revealDirection === "end") return n - 1 - rev.size;
      const m = Math.floor(n / 2),
        o = Math.floor(rev.size / 2);
      return rev.size % 2 === 0 ? m + o : m - o - 1;
    };
    const t = setInterval(() => {
      if (sequential) {
        if (rev.size < text.length) {
          rev.add(next());
          setRevealed(new Set(rev));
        } else {
          clearInterval(t);
          setDisplay(text);
          onDone && onDone();
          return;
        }
      }
      setDisplay(
        text
          .split("")
          .map((c, i) =>
            c === " "
              ? " "
              : rev.has(i)
                ? c
                : chars[Math.floor(Math.random() * chars.length)],
          )
          .join(""),
      );
      if (!sequential && ++iter >= maxIterations) {
        clearInterval(t);
        setDisplay(text);
        onDone && onDone();
      }
    }, speed);
    return () => clearInterval(t);
  }, [active, text]);
  return (
    <span
      ref={ref}
      className={className}
      aria-label={text}
      onMouseEnter={() => animateOn === "hover" && setActive(true)}
    >
      {display.split("").map((c, i) => (
        <span
          key={i}
          className={
            revealed.has(i) || display === text ? "" : encryptedClassName
          }
          aria-hidden="true"
        >
          {c}
        </span>
      ))}
    </span>
  );
}
