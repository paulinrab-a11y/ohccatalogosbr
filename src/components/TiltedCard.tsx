/* Ported from React Bits — TiltedCard (src/ts-tailwind/Components/TiltedCard/TiltedCard.tsx), motion springs
   https://reactbits.dev/components/tilted-card — MIT + Commons Clause © David Haz. Adapted: touch devices get a subtle tap-scale instead of tilt. */
import { motion, useMotionValue, useSpring } from "motion/react";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { isTouch, reduced } from "../lib/motion";
const springValues = { damping: 30, stiffness: 100, mass: 2 };
export default function TiltedCard({
  children,
  className = "",
  rotateAmplitude = 10,
  scaleOnHover = 1.04,
}: {
  children: ReactNode;
  className?: string;
  rotateAmplitude?: number;
  scaleOnHover?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), springValues),
    rotateY = useSpring(useMotionValue(0), springValues),
    scale = useSpring(1, springValues);
  const still = reduced() || isTouch();
  const onMove = (e: MouseEvent) => {
    if (still || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2,
      y = e.clientY - r.top - r.height / 2;
    rotateX.set((y / (r.height / 2)) * -rotateAmplitude);
    rotateY.set((x / (r.width / 2)) * rotateAmplitude);
  };
  return (
    <motion.div
      ref={ref}
      className={`[perspective:900px] ${className}`}
      onMouseMove={onMove}
      onMouseEnter={() => !still && scale.set(scaleOnHover)}
      onMouseLeave={() => {
        scale.set(1);
        rotateX.set(0);
        rotateY.set(0);
      }}
      whileTap={still ? { scale: 0.98 } : undefined}
    >
      <motion.div
        style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}
        className="h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
