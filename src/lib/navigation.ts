const ROUTES = new Set([
  "/",
  "/catalogo",
  "/conta",
  "/conta/criar",
  "/conta/recuperar",
  "/conta/redefinir",
  "/conta/confirmar",
  "/minha-conta",
  "/produto",
  "/compatibilidade",
  "/admin",
  "/admin/login",
  "/admin/consultas",
  "/admin/produtos",
  "/admin/regras",
  "/admin/midia",
  "/admin/administradores",
  "/admin/auditoria",
  "/admin/configuracoes",
]);
export function internalDestination(
  value: string,
  origin: string,
): string | null {
  if (
    !value.startsWith("/") ||
    /%|\/\./.test(value.split(/[?#]/)[0]) ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return null;
  try {
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      !ROUTES.has(url.pathname.replace(/\/+$/, "") || "/")
    )
      return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}
