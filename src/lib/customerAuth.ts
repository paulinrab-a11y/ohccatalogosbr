import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useSyncExternalStore } from "react";

// Only display data lives here. Authorization stays in Supabase and the admin gateway.
type State = {
  user: User | null;
  loading: boolean;
  unavailable: boolean;
  linkError: boolean;
};
let state: State = {
  user: null,
  loading: true,
  unavailable: false,
  linkError: false,
};
const listeners = new Set<() => void>();
function publish(next: Partial<State>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
let clientPromise: Promise<SupabaseClient> | undefined;
let initialization: Promise<void> | undefined;
let unsubscribe: (() => void) | undefined;

export function customerClient() {
  if (!clientPromise)
    clientPromise = (async () => {
      const [response, sdk] = await Promise.all([
        fetch("/api/customer-config", {
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        }),
        import("@supabase/supabase-js"),
      ]);
      if (!response.ok) throw new Error("auth_unavailable");
      const config = await response.json();
      if (
        typeof config.url !== "string" ||
        typeof config.publishableKey !== "string"
      )
        throw new Error("auth_unavailable");
      const client = sdk.createClient(config.url, config.publishableKey, {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: `ohc-customer-${new URL(config.url).hostname}`,
        },
        global: {
          fetch: (input, init) =>
            fetch(input, {
              ...init,
              signal: init?.signal ?? AbortSignal.timeout(15000),
            }),
        },
      });
      return client;
    })();
  return clientPromise;
}

async function initialize() {
  if (initialization) return initialization;
  // Capture and remove callback material before any asynchronous work or telemetry.
  const callback = ["/conta/confirmar", "/conta/redefinir"].includes(
    location.pathname,
  );
  const params = new URLSearchParams(location.search);
  const code = callback ? params.get("code") : null;
  const flowId = callback ? params.get("sb_flow_id") : null;
  const invalid = callback && (params.has("error") || !!location.hash);
  if (callback && (location.search || location.hash))
    history.replaceState(null, "", location.pathname);
  initialization = (async () => {
    try {
      const client = await customerClient();
      const subscription = client.auth.onAuthStateChange((_event, session) => {
        publish({ user: session?.user ?? null });
      });
      unsubscribe = () => subscription.data.subscription.unsubscribe();
      if (invalid) {
        publish({ linkError: true });
        return;
      }
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(
          code,
          flowId ? { flowId } : undefined,
        );
        if (error) {
          publish({ linkError: true });
          return;
        }
      }
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      // Check with Auth before showing persisted private profile data.
      if (data.session) {
        const verified = await client.auth.getUser();
        if (verified.error) {
          if (verified.error.status === 401 || verified.error.status === 403)
            await client.auth.signOut({ scope: "local" });
          else throw verified.error;
        }
        publish({ user: verified.data.user });
      } else publish({ user: null });
    } catch {
      publish({ unavailable: true, user: null });
    } finally {
      publish({ loading: false });
    }
  })();
  return initialization;
}
export function useCustomerAuth() {
  const snapshot = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    void initialize();
  }, []);
  return snapshot;
}
// The single app-lifetime subscription is not multiplied by StrictMode/remounts.
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    unsubscribe?.();
  });
