/* "Qual é o seu carro?": the primary action, in working form. The brand comes
   from the catalog; model or chassis is free text that becomes the catalog search.
   The choice is remembered; committing it paints the livery stripe once. */
import { useEffect, useId, useState } from "react";
import { brands, useProducts } from "../lib/products";
import { useRoute } from "../lib/router";
import { carCatalogHref, readCar, saveCar } from "../lib/myCar";
import { reduced } from "../lib/motion";

export default function CarPicker({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const products = useProducts();
  const list = brands(products);
  const { go } = useRoute();
  const id = useId();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [painting, setPainting] = useState(false);
  useEffect(() => {
    const saved = readCar();
    if (saved) {
      setBrand(saved.brand);
      setModel(saved.model);
    }
  }, []);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) return;
    const prev = readCar();
    // Same car as before: keep the year it was saved with.
    const car =
      prev?.year && prev.brand === brand && prev.model === model.trim()
        ? { brand, model: model.trim(), year: prev.year }
        : { brand, model: model.trim() };
    saveCar(car);
    if (reduced()) return go(carCatalogHref(car));
    setPainting(true);
    setTimeout(() => go(carCatalogHref(car)), 420);
  };
  return (
    <form
      onSubmit={submit}
      className={`decal relative overflow-hidden ${compact ? "p-3" : "p-4 sm:p-5"} ${className}`}
      aria-label="Encontrar o volante do seu carro"
    >
      {!compact && (
        <p className="font-display text-[28px] leading-none tracking-wide sm:text-[32px]">
          Qual é o seu carro?
        </p>
      )}
      <div
        className={`${compact ? "" : "mt-3"} grid gap-3 ${compact ? "grid-cols-[minmax(0,1fr)_auto] items-end" : "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"}`}
      >
        <div className="ub-field">
          <label htmlFor={`${id}-marca`}>
            {compact ? "Qual é o seu carro?" : "Marca"}
          </label>
          <select
            id={`${id}-marca`}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          >
            <option value="">{compact ? "Marca" : "Escolha a marca"}</option>
            {list.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        {!compact && (
          <div className="ub-field">
            <label htmlFor={`${id}-modelo`}>Modelo ou chassi (opcional)</label>
            <input
              id={`${id}-modelo`}
              name="modelo"
              value={model}
              maxLength={60}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ex.: M3, F30, W205…"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={!brand}
          className="btn btn-blue min-h-12 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Ver volantes
        </button>
      </div>
      <p
        className={`mt-3 text-[13px] text-ohc-steel ${compact ? "hidden sm:block" : ""}`}
      >
        A equipe confirma a aplicação no seu carro antes da compra.
      </p>
      {painting && (
        <span
          aria-hidden="true"
          className="livery livery-rule livery-paint absolute inset-x-0 bottom-0"
        />
      )}
    </form>
  );
}
