/* Fitment plate: application, model years and code in ruled cells. Missing
   data reads "a confirmar"; nothing is filled in by guesswork. */
import type { Product } from "../lib/products";

export default function FitmentPlate({
  p,
  application = p.application,
  showCode = true,
  className = "",
}: {
  p: Product;
  /** Shortened application text for narrow cards. */
  application?: string;
  showCode?: boolean;
  className?: string;
}) {
  const cells: [string, string | null | undefined][] = [
    ["Aplicação", application],
    ["Anos", p.years],
  ];
  if (showCode) cells.push(["Código", p.sku]);
  return (
    <dl
      className={`plate ${className}`}
      style={{ "--cells": cells.length } as React.CSSProperties}
    >
      {cells.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className={value ? "" : "pending"}>{value || "a confirmar"}</dd>
        </div>
      ))}
    </dl>
  );
}
