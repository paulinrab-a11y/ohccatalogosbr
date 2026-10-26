/* Fitment plate: application, model years and code in ruled cells. Missing
   data reads "a confirmar"; nothing is filled in by guesswork. */
import type { Product } from "../lib/products";

export default function FitmentPlate({
  p,
  showCode = true,
  className = "",
}: {
  p: Product;
  showCode?: boolean;
  className?: string;
}) {
  const cells: [string, string | null | undefined][] = [
    ["Aplicação", p.application],
    ["Anos", p.years],
  ];
  if (showCode) cells.push(["Código", p.sku]);
  return (
    <dl
      className={`plate ${className}`}
      style={{ "--cells": cells.length } as React.CSSProperties}
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
          <dd className={value ? "" : "pending"}>
            {/* Long chassis lists break after a slash, never inside a code. */}
            {value ? value.replace(/\//g, "/\u200b") : "a confirmar"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
