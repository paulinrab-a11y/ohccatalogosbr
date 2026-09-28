export const reduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;
export const isTouch = () =>
  typeof matchMedia !== "undefined" && matchMedia("(hover: none)").matches;
