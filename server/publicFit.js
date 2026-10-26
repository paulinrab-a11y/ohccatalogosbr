/* "Serve no meu carro?": a read-only look at the compatibility base for one
   car. Same rules as the compatibility form (approved rules plus the chassis
   inferred from model and year), but nothing is recorded. Only what the visitor
   may see leaves the server: code, status and the public notes. */
import { problem } from "./runtime.js";

const STATUSES = new Set([
  "compativel",
  "compativel_com_condicoes",
  "incompativel",
]);

function text(value, max) {
  if (value == null) return "";
  if (typeof value !== "string") throw problem("Carro inválido.");
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length > max || /[\u0000-\u001f<>]/.test(clean))
    throw problem("Carro inválido.");
  return clean;
}

/** Query string -> RPC arguments; throws 400 on anything odd. */
export function fitQuery(query) {
  const brand = text(query.marca, 60);
  const model = text(query.modelo, 60);
  const chassis = text(query.chassi, 30);
  const year = Number(query.ano);
  if (
    !brand ||
    !model ||
    !/^\d{4}$/.test(String(query.ano)) ||
    year < 1950 ||
    year > new Date().getFullYear() + 1
  )
    throw problem("Informe marca, modelo e ano.");
  return {
    p_vehicle_brand: brand,
    p_vehicle_model: model,
    p_vehicle_year: year,
    p_chassis_platform: chassis || null,
  };
}

/** RPC result -> public answer. Conflicting rules count as "confirm". */
export function shapeFit(result) {
  const results = Array.isArray(result?.results) ? result.results : [];
  const chassis =
    result?.normalized_input?.inferred_chassis_key ||
    result?.normalized_input?.chassis_platform_key ||
    "";
  return {
    chassis: chassis ? String(chassis).toUpperCase() : null,
    matched: result?.matched === true,
    products: results
      .filter((r) => typeof r?.sku === "string" && STATUSES.has(r.status))
      .map((r) => ({
        sku: r.sku,
        status: r.status,
        notes: typeof r.public_notes === "string" ? r.public_notes : null,
        conditions:
          typeof r.installation_conditions === "string"
            ? r.installation_conditions
            : null,
      })),
  };
}
