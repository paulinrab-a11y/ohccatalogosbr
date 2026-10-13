/* A two-line title painted on the livery stripe: the first line sits in the
   blue field, the second in the red, the white hairline runs in the gap
   between them. Built from stacked bands so lettering and stripe always
   register, whatever the font size. Full bleed; the wrapper keeps the skewed
   corners from adding scroll width.
   paint="fill": stripe only (drawn behind the 3D canvas on wide screens).
   paint="text": lettering only, laid over a "fill" copy at the same place.
   paint="both": stripe and lettering together (the default).
   paint="lg-text": both on phones, lettering only from lg up (hero). */
import type { ElementType } from "react";

type Props = {
  lines: [string, string];
  as?: ElementType;
  /** Wrapper: spacing and position. */
  className?: string;
  /** Title: font size. */
  titleClass?: string;
  paint?: "both" | "fill" | "text" | "lg-text";
  id?: string;
};

export default function LiveryTitle({
  lines,
  as: Tag = "h1",
  className = "",
  titleClass = "",
  paint = "both",
  id,
}: Props) {
  const fill = paint !== "text";
  // From lg up the hero stripe is drawn behind the canvas instead.
  const off = paint === "lg-text" ? "lg:bg-transparent" : "";
  const text = paint !== "fill";
  return (
    <div
      className={`overflow-hidden py-[7.5vw] ${className}`}
      aria-hidden={paint === "fill" ? true : undefined}
    >
      <Tag
        id={id}
        className={`livery-skew font-display font-normal uppercase leading-[0.86] tracking-wide ${text ? "text-white" : "text-transparent"} ${titleClass}`}
      >
        <span className={`block ${fill ? `bg-ohc-blue ${off}` : ""}`}>
          <span className="wrap block pt-[0.1em] pb-[0.04em]">{lines[0]} </span>
        </span>
        <span
          aria-hidden="true"
          className={`block h-[0.07em] ${fill ? `bg-ohc-text ${off}` : ""}`}
        />
        <span className={`block ${fill ? `bg-ohc-red ${off}` : ""}`}>
          <span className="wrap block pt-[0.1em] pb-[0.04em]">{lines[1]}</span>
        </span>
      </Tag>
    </div>
  );
}
