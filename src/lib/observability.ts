import { safeEvent } from "./telemetry";
let report: ((error: unknown, component: string) => void) | undefined;
export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  try {
    const url = new URL(dsn);
    if (
      url.protocol !== "https:" ||
      !/\.ingest(?:\.us|\.de)?\.sentry\.io$/.test(url.hostname)
    )
      return;
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn,
      sendDefaultPii: false,
      defaultIntegrations: false,
      integrations: [Sentry.globalHandlersIntegration()],
      tracesSampleRate: 0,
      beforeSend: (event) => safeEvent(event),
    });
    report = (error, component) => {
      Sentry.captureException(error, { tags: { component } });
    };
  } catch {
    /* Monitoring must never prevent rendering. */
  }
}
export function reportError(error: unknown, component = "app") {
  report?.(error, component);
}
