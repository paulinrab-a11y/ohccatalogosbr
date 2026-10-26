/* The visitor's car, remembered between visits so the catalog can open on it.
   Storage may be blocked (private mode, site data off): every access is guarded.
   The year is optional; with brand, model and year the site can say which
   wheels fit ("serve no meu carro?"). */
import { useEffect, useState } from "react";

export type MyCar = { brand: string; model: string; year?: number };

const KEY = "ohc-carro";
const EVENT = "ohc-carro";

const validYear = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 1950 &&
  value <= new Date().getFullYear() + 1;

export function parseCar(raw: string | null): MyCar | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<MyCar>;
    const brand = typeof value.brand === "string" ? value.brand.trim() : "";
    const model = typeof value.model === "string" ? value.model.trim() : "";
    if (!brand || brand.length > 60 || model.length > 60) return null;
    return validYear(value.year)
      ? { brand, model, year: value.year }
      : { brand, model };
  } catch {
    return null;
  }
}

export function readCar(): MyCar | null {
  try {
    return parseCar(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function saveCar(car: MyCar) {
  try {
    localStorage.setItem(KEY, JSON.stringify(car));
  } catch {
    /* storage blocked: the choice simply is not remembered */
  }
  // Every open view (catalog bar, product page) follows the new car.
  dispatchEvent(new CustomEvent(EVENT, { detail: car }));
}

/** The remembered car, kept in step across components on the page. */
export function useMyCar() {
  const [car, setCar] = useState<MyCar | null>(null);
  useEffect(() => {
    setCar(readCar());
    const on = (e: Event) => setCar((e as CustomEvent<MyCar>).detail);
    addEventListener(EVENT, on);
    return () => removeEventListener(EVENT, on);
  }, []);
  return car;
}

/** Brand, model and year: enough to ask which wheels fit. */
export const carComplete = (car: MyCar | null): car is Required<MyCar> =>
  !!car?.brand && !!car.model && validYear(car.year);

/** Catalog URL for a car: brand filter plus the model/chassis as the search text. */
export function carCatalogHref(car: MyCar) {
  const params = new URLSearchParams({ marca: car.brand });
  if (car.model) params.set("q", car.model);
  return `/catalogo?${params.toString()}`;
}

export const carLabel = (car: MyCar) =>
  [car.brand, car.model, car.year].filter(Boolean).join(" ");
