import { useEffect, useState } from "react";
const q = (s: string) =>
  typeof matchMedia !== "undefined" && matchMedia(s).matches;
export function useIsMobile() {
  const [m, set] = useState(() => q("(max-width: 860px)"));
  useEffect(() => {
    const mq = matchMedia("(max-width: 860px)");
    const on = () => set(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return m;
}
export const prefersReduced = () => q("(prefers-reduced-motion: reduce)");
export const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};
export const isTouch = () => q("(hover: none)");
