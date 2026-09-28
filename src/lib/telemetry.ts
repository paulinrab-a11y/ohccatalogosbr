const COMPONENTS = new Set(["app", "3d", "runtime"]);
/** Rebuild an allowlisted event: never send form data, URLs with queries, users or breadcrumbs. */
export function safeEvent(event: {
  event_id?: string;
  timestamp?: number;
  tags?: Record<string, unknown>;
  exception?: {
    values?: Array<{
      stacktrace?: {
        frames?: Array<{ filename?: string; lineno?: number; colno?: number }>;
      };
    }>;
  };
}) {
  const frames = (event.exception?.values?.[0]?.stacktrace?.frames ?? [])
    .flatMap((frame) => {
      try {
        const url = new URL(frame.filename ?? "");
        if (!/^\/assets\/[A-Za-z0-9_.-]+\.js$/.test(url.pathname)) return [];
        return [
          { filename: url.pathname, lineno: frame.lineno, colno: frame.colno },
        ];
      } catch {
        return [];
      }
    })
    .slice(-20);
  const component = String(event.tags?.component ?? "runtime");
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: "javascript",
    level: "error" as const,
    tags: { component: COMPONENTS.has(component) ? component : "runtime" },
    exception: {
      values: [
        {
          type: "Error",
          value: "Application error (details removed for privacy)",
          stacktrace: { frames },
        },
      ],
    },
  };
}
