/* The visitor's car, remembered between visits so the catalog can open on it.
   Storage may be blocked (private mode, site data off): every access is guarded. */
export type MyCar = { brand: string; model: string };

const KEY = "ohc-carro";

export function parseCar(raw: string | null): MyCar | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<MyCar>;
    const brand = typeof value.brand === "string" ? value.brand.trim() : "";
    const model = typeof value.model === "string" ? value.model.trim() : "";
    if (!brand || brand.length > 60 || model.length > 60) return null;
    return { brand, model };
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
}

/** Catalog URL for a car: brand filter plus the model/chassis as the search text. */
export function carCatalogHref(car: MyCar) {
  const params = new URLSearchParams({ marca: car.brand });
  if (car.model) params.set("q", car.model);
  return `/catalogo?${params.toString()}`;
}

export const carLabel = (car: MyCar) =>
  car.model ? `${car.brand} ${car.model}` : car.brand;
