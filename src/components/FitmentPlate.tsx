/* Fitment plate: application, model years and code in ruled cells. Missing
   data reads "a confirmar"; nothing is filled in by guesswork.
   variant="rows" (cards): one ruled row per value, label left and value right,
   and rows without data are left out so narrow cards stay readable. */
import type { Product } from "../lib/products";

export default function FitmentPlate({
  p,
  application = p.application,
  showCode = true,
  variant = "cells",
  className = "",
}: {
  p: Product;
  /** Shortened application text for narrow cards. */
  application?: string;
  showCode?: boolean;
  variant?: "cells" | "rows";
  className?: string;
}) {
  const rows = variant === "rows";
  let cells: [string, string | null | undefined][] = [
    ["Aplicação", application],
    ["Anos", p.years],
  ];
  if (showCode) cells.push(["Código", p.sku]);
  if (rows) cells = cells.filter(([, value]) => value);
  if (!cells.length) return null;
  return (
    <dl
      className={`plate ${rows ? "plate-rows" : ""} ${className}`}
      style={{ "--cells": rows ? 1 : cells.length } as React.CSSProperties}
    >
      {cells.map(([label, value]) => (
        // The code is what the buyer quotes: never broken across lines.
        <div
          key={label}
          className={
            label === "Código" ? "[overflow-wrap:normal] whitespace-nowrap" : ""
          }
        >
          <dt>{label}</dt>
          <dd className={value ? "" : "pending"}>{value || "a confirmar"}</dd>
        </div>
      ))}
    </dl>
  );
}
