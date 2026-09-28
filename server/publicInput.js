import { problem } from "./runtime.js";

export function publicInput(body) {
  const fields = {
    vehicle_brand: 80,
    vehicle_model: 120,
    vehicle_version: 120,
    vehicle_generation: 120,
    vehicle_chassis_platform: 120,
    generation_chassis: 120,
    vehicle_motorization: 120,
    current_steering_notes: 1000,
  };
  const result = {};
  for (const [key, max] of Object.entries(fields)) {
    const value = body[key];
    if (value === undefined || value === null) {
      result[key] = null;
      continue;
    }
    if (
      typeof value !== "string" ||
      value.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
    )
      throw problem("Campo técnico inválido ou longo demais.");
    result[key] = value.trim() || null;
  }
  if (
    !result.vehicle_brand ||
    !result.vehicle_model ||
    !Number.isInteger(body.vehicle_year) ||
    body.vehicle_year < 1950 ||
    body.vehicle_year > 2100
  )
    throw problem("Preencha marca, modelo e ano válidos.");
  if (body.consent_data_images !== true)
    throw problem(
      "Autorize o uso dos dados técnicos e imagens para realizar a consulta.",
    );
  return {
    ...result,
    vehicle_year: body.vehicle_year,
    consent_data_images: true,
  };
}
