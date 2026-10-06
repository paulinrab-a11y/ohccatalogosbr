export type AdminUser = { email: string; role?: string | null };

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
      credentials: "same-origin",
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    // Network failures and timeouts carry English browser messages; show ours.
    throw new Error(
      "Sem resposta do servidor. Confira a conexão e tente novamente.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data?.error || "Não foi possível concluir a solicitação.",
    ) as Error & { status?: number; data?: any };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as T;
}

export const adminAuth = {
  me: () => api<{ user: AdminUser }>("/api/admin/me"),
  requestAccess: (email: string) =>
    api<{ ok: boolean }>("/api/admin/request-access", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  createSession: (payload: Record<string, unknown>) =>
    api<{ ok: boolean; user: AdminUser }>("/api/admin/session", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () =>
    api<{ ok: boolean }>("/api/admin/logout", { method: "POST", body: "{}" }),
};

export async function adminAction<T = any>(payload: Record<string, unknown>) {
  return api<T>("/api/admin/action", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminManage<T = any>(payload: Record<string, unknown>) {
  return api<T>("/api/admin/manage", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
