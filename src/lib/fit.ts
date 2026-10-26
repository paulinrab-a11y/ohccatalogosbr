/* "Serve no meu carro?": which wheels fit the visitor's car, from /api/fit.
   One request per car answers for the whole catalog; answers are kept for the
   visit. Anything the base does not know reads "confirmar" (the team checks),
   never "não serve". */
import { useEffect, useState } from "react";
import { carComplete, carLabel, type MyCar } from "./myCar";

export type FitStatus = "serve" | "condicoes" | "nao" | "confirmar";
export type FitItem = {
  status: FitStatus;
  notes: string | null;
  conditions: string | null;
};
export type Fit = { chassis: string | null; bySku: Record<string, FitItem> };

const FROM_API: Record<string, FitStatus> = {
  compativel: "serve",
  compativel_com_condicoes: "condicoes",
  incompativel: "nao",
};

export const FIT_LABEL: Record<FitStatus, string> = {
  serve: "Serve no seu carro",
  condicoes: "Serve com condições",
  nao: "Não serve no seu carro",
  confirmar: "Confirmar com a equipe",
};

type ApiFit = {
  chassis?: string | null;
  products?: {
    sku: string;
    status: string;
    notes?: string | null;
    conditions?: string | null;
  }[];
};

export function parseFit(data: ApiFit): Fit {
  const bySku: Record<string, FitItem> = {};
  for (const p of data.products || []) {
    const status = FROM_API[p.status];
    if (status && typeof p.sku === "string")
      bySku[p.sku] = {
        status,
        notes: p.notes ?? null,
        conditions: p.conditions ?? null,
      };
  }
  return { chassis: data.chassis || null, bySku };
}

export const fitOf = (fit: Fit | null, sku: string): FitItem =>
  fit?.bySku[sku] || { status: "confirmar", notes: null, conditions: null };

const cache = new Map<string, Promise<Fit | null>>();

function loadFit(car: Required<MyCar>): Promise<Fit | null> {
  const params = new URLSearchParams({
    marca: car.brand,
    modelo: car.model,
    ano: String(car.year),
  });
  const key = params.toString();
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(`/api/fit?${key}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => (data ? parseFit(data) : null))
      .catch(() => null);
    // A failure is not remembered: the next view may try again.
    pending.then((fit) => fit || cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

/** The fit for a car; null while loading, when incomplete or when the
    service is unavailable (the site then simply shows no seals). */
export function useFit(car: MyCar | null) {
  const [fit, setFit] = useState<Fit | null>(null);
  const [loading, setLoading] = useState(false);
  const key = carComplete(car) ? carLabel(car) : "";
  useEffect(() => {
    setFit(null);
    if (!carComplete(car)) return;
    let live = true;
    setLoading(true);
    loadFit(car).then((value) => {
      if (!live) return;
      setFit(value);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [key]);
  return { fit, loading };
}

/** The sentence the WhatsApp message carries about the car. */
export function fitSentence(car: MyCar | null, fit: Fit | null, sku: string) {
  if (!carComplete(car)) return "";
  const chassis = fit?.chassis ? ` (chassi ${fit.chassis})` : "";
  const item = fitOf(fit, sku);
  // The condition rides along, so the team (and the WhatsApp robot) can name it.
  const condition = item.conditions
    ? `: ${item.conditions.replace(/\.$/, "")}`
    : "";
  const which = {
    serve: "pelo site, serve no meu carro",
    condicoes: `pelo site, serve com condições${condition}`,
    nao: "pelo site, não serve; queria ver outra opção",
    confirmar: "queria confirmar se serve",
  }[item.status];
  return `Meu carro: ${carLabel(car)}${chassis}; ${which}.`;
}
