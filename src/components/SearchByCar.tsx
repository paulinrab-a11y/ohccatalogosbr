/* "Busque pela sua marca": entrada rápida para o catálogo filtrado por MARCA.
   Marcas vêm de brands(products) (derivadas do products.json: sem duplicatas, ordem alfabética).
   Sem modelo, sem ano, sem contagem: o filtro real é o do catálogo (/catalogo?marca=...). */
import { useState } from "react";
import { brands, useProducts } from "../lib/products";
import { useRoute } from "../lib/router";
export default function SearchByCar() {
  const products = useProducts();
  const [brand, setBrand] = useState("");
  const { go } = useRoute();
  const list = brands(products);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (brand) go(`/catalogo?marca=${encodeURIComponent(brand)}`);
  };
  return (
    <form
      className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
      onSubmit={submit}
      aria-describedby="brand-help"
    >
      <div className="ub-field">
        <label htmlFor="s-brand">Marca</label>
        <select
          id="s-brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          aria-required="true"
        >
          <option value="">Selecione uma marca</option>
          {list.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={!brand}
        aria-disabled={!brand}
        className="btn btn-blue w-full md:w-auto min-h-[48px] disabled:cursor-not-allowed disabled:opacity-45"
      >
        Ver no catálogo
      </button>
      <p id="brand-help" className="text-[12px] text-ohc-steel md:col-span-2">
        {brand
          ? "A compatibilidade final do produto pode ser confirmada pela equipe OHC Motors."
          : "Selecione uma marca."}
      </p>
    </form>
  );
}
