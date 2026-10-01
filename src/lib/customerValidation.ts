export const RECOVERY_MESSAGE =
  "Se existir uma conta associada a este e-mail, enviaremos as instruções de recuperação.";
export function emailValue(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Informe um e-mail válido.");
  return email;
}
export function passwordError(password: string, confirmation: string) {
  if (password !== password.trim())
    return "Remova os espaços no início ou no fim da senha.";
  if (password.length < 12 || password.length > 128)
    return "Use uma senha de 12 a 128 caracteres.";
  if (password !== confirmation) return "As senhas não coincidem.";
  return "";
}
export function authError(error: unknown) {
  const e = error as { code?: string; status?: number } | null;
  if (e?.status === 429 || e?.code?.includes("rate_limit"))
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (e?.code === "email_not_confirmed")
    return "Confirme seu e-mail antes de entrar. Verifique também a pasta de spam.";
  if (e?.code === "invalid_credentials") return "E-mail ou senha inválidos.";
  if (e?.code === "weak_password")
    return "Escolha uma senha mais forte, com letras, números e símbolos.";
  if (e?.code === "same_password")
    return "Escolha uma senha diferente da atual.";
  return "Não foi possível concluir. Tente novamente em alguns instantes.";
}

export function verificationCode(value: string) {
  const code = value.replace(/\D/g, "").slice(0, 6);
  if (!/^\d{6}$/.test(code))
    throw new Error("Informe o código de 6 dígitos recebido por e-mail.");
  return code;
}
