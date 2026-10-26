/* "Serve no meu carro?": the visitor names the car once (brand, model, year)
   and every card and product page answers for it. The fit seal is a decal in
   the livery colours; WhatsApp green stays reserved for the purchase. */
import { useEffect, useId, useState } from "react";
import { brands, useProducts } from "../lib/products";
import { carComplete, carLabel, saveCar, type MyCar } from "../lib/myCar";
import { FIT_LABEL, type Fit, type FitItem, type FitStatus } from "../lib/fit";

const SEAL: Record<FitStatus, string> = {
  serve: "bg-[#182033] text-white shadow-[inset_0_0_0_1px_#3b7bff]",
  condicoes: "bg-[#182033] text-[#afc8ff] shadow-[inset_0_0_0_1px_#2b313b]",
  nao: "bg-[#2a1416] text-[#ff8a8f] shadow-[inset_0_0_0_1px_#ed1c24]",
  confirmar: "bg-[#12151b] text-[#c9d0d8] shadow-[inset_0_0_0_1px_#2b313b]",
};
const MARK: Record<FitStatus, string> = {
  serve: "✓",
  condicoes: "!",
  nao: "×",
  confirmar: "?",
};

export function FitSeal({
  status,
  className = "",
}: {
  status: FitStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-bold leading-none sm:text-[12px] ${SEAL[status]} ${className}`}
    >
      <span aria-hidden="true">{MARK[status]}</span>
      {FIT_LABEL[status]}
    </span>
  );
}

/** The answer for one product: the seal plus what the team wrote about it. */
export function FitAnswer({ item }: { item: FitItem }) {
  return (
    <div className="mt-3 grid gap-1.5" aria-live="polite">
      <FitSeal status={item.status} className="w-fit text-[13px]!" />
      {item.conditions && (
        <p className="text-sm text-[#c9d0d8]">
          <b className="text-ohc-text">Condição: </b>
          {item.conditions}
        </p>
      )}
      {item.status === "confirmar" && (
        <p className="text-sm text-[#c9d0d8]">
          A base do site ainda não tem esse carro com este volante. A equipe
          confirma pelo WhatsApp com fotos do volante atual.
        </p>
      )}
    </div>
  );
}

export default function CarFit({
  car,
  fit,
  loading,
  defaultBrand = "",
  title = "Serve no meu carro?",
  narrow = false,
}: {
  car: MyCar | null;
  fit: Fit | null;
  loading: boolean;
  defaultBrand?: string;
  title?: string;
  /** Two-by-two fields, for a column next to the product photo. */
  narrow?: boolean;
}) {
  const id = useId();
  const list = brands(useProducts());
  const [editing, setEditing] = useState(false);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  useEffect(() => {
    setBrand(car?.brand || defaultBrand);
    setModel(car?.model || "");
    setYear(car?.year ? String(car.year) : "");
  }, [car, defaultBrand]);
  const complete = carComplete(car);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const y = Number(year);
    if (!brand || !model.trim() || !Number.isInteger(y)) return;
    saveCar({ brand, model: model.trim(), year: y });
    setEditing(false);
  };
  if (complete && !editing)
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span>
          Seu carro: <b>{carLabel(car)}</b>
          {fit?.chassis && (
            <span className="text-ohc-steel"> · chassi {fit.chassis}</span>
          )}
        </span>
        {loading && <span className="text-ohc-steel">Verificando…</span>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-11 font-bold text-[#afc8ff] underline underline-offset-4 hover:text-white"
        >
          Trocar carro
        </button>
      </div>
    );
  return (
    <form
      onSubmit={submit}
      aria-label={title}
      className={`grid items-end gap-3 ${narrow ? "grid-cols-2" : "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem_auto]"}`}
    >
      <div className="ub-field">
        <label htmlFor={`${id}-marca`}>Marca</label>
        <select
          id={`${id}-marca`}
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
        >
          <option value="">Escolha</option>
          {list.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div className="ub-field">
        <label htmlFor={`${id}-modelo`}>Modelo</label>
        <input
          id={`${id}-modelo`}
          value={model}
          maxLength={60}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Ex.: 320i, C180, Golf"
          required
        />
      </div>
      <div className="ub-field">
        <label htmlFor={`${id}-ano`}>Ano</label>
        <input
          id={`${id}-ano`}
          value={year}
          inputMode="numeric"
          pattern="(19|20)[0-9]{2}"
          maxLength={4}
          autoComplete="off"
          onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
          placeholder="2015"
          required
        />
      </div>
      <button type="submit" className="btn btn-blue min-h-12">
        Ver o que serve
      </button>
    </form>
  );
}
