import { PRODUCTS } from "./products";
const LIMITS = {
  marca: 80,
  modelo: 120,
  ano: 4,
  versao: 120,
  acc: 8,
  sku: 80,
  obs: 1000,
};
export function compatibilityMessage(
  input: Record<string, unknown>,
  year = new Date().getFullYear(),
): string {
  if (Object.keys(input).some((k) => !(k in LIMITS)))
    throw new Error("Campo inesperado.");
  const values: Record<string, string> = {};
  for (const [key, max] of Object.entries(LIMITS)) {
    const value = input[key] ?? "";
    if (
      typeof value !== "string" ||
      value.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
    )
      throw new Error("Revise os campos preenchidos.");
    values[key] = value.trim();
  }
  const v = values;
  if (
    !v.marca ||
    !v.modelo ||
    !/^\d{4}$/.test(v.ano) ||
    Number(v.ano) < 1950 ||
    Number(v.ano) > year + 1
  )
    throw new Error("Preencha marca, modelo e um ano válido.");
  if (!["", "Sim", "Não"].includes(v.acc))
    throw new Error("Selecione uma opção de ACC válida.");
  const prod = PRODUCTS.find((p) => p.sku === v.sku);
  if (v.sku && !prod) throw new Error("Selecione um produto do catálogo.");
  return [
    "Olá! Quero confirmar a compatibilidade de um produto OHC Motors.",
    `Carro: ${v.marca} ${v.modelo}`,
    `Ano: ${v.ano}`,
    v.versao ? `Versão/geração: ${v.versao}` : "",
    v.acc ? `Controle de cruzeiro adaptativo (ACC): ${v.acc}` : "",
    prod
      ? `Produto: ${prod.name} (SKU ${prod.sku})`
      : "Produto: ainda não escolhi",
    v.obs ? `Obs: ${v.obs}` : "",
    "Vou enviar as 3 fotos do volante atual em seguida.",
  ]
    .filter(Boolean)
    .join("\n");
}
