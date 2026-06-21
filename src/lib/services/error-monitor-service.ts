export type ErrorLevel = "error" | "warning" | "info";

export type ErrorEvent = {
  id: string;
  timestamp: Date;
  level: ErrorLevel;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  resolved: boolean;
};

const MAX_EVENTS = 500;

declare global {
  // eslint-disable-next-line no-var
  var __errorMonitorBuffer: ErrorEvent[] | undefined;
}

const buffer: ErrorEvent[] = global.__errorMonitorBuffer ?? [];
if (process.env.NODE_ENV !== "production") {
  global.__errorMonitorBuffer = buffer;
}

function genId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function push(event: ErrorEvent): void {
  buffer.push(event);
  while (buffer.length > MAX_EVENTS) {
    buffer.shift();
  }
}

type ParsedDsn = {
  storeUrl: string;
  publicKey: string;
};

function parseSentryDsn(dsn: string): ParsedDsn | null {
  try {
    const u = new URL(dsn);
    const publicKey = u.username;
    if (!publicKey) return null;
    const projectId = u.pathname.replace(/^\//, "").split("/").pop();
    if (!projectId) return null;
    const host = u.host;
    const protocol = u.protocol;
    return {
      publicKey,
      storeUrl: `${protocol}//${host}/api/${projectId}/store/`
    };
  } catch {
    return null;
  }
}

async function sendToSentry(event: ErrorEvent): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;
  const release = process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA;
  const env = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";
  const payload: Record<string, unknown> = {
    event_id: event.id.replace(/-/g, "").slice(0, 32),
    timestamp: event.timestamp.toISOString(),
    level: event.level,
    platform: "node",
    environment: env,
    logger: "admin-office",
    message: { formatted: event.message },
    extra: event.context ?? {}
  };
  if (release) payload.release = release;
  if (event.stack) {
    payload.exception = {
      values: [
        {
          type: "Error",
          value: event.message,
          stacktrace: { frames: parseStack(event.stack) }
        }
      ]
    };
  }
  try {
    await fetch(parsed.storeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=admin-office/1.0, sentry_key=${parsed.publicKey}`
      },
      body: JSON.stringify(payload)
    });
  } catch {
    // best-effort
  }
}

function parseStack(stack: string): Array<{ filename: string; function?: string; lineno?: number; colno?: number }> {
  const lines = stack.split("\n").slice(1, 21);
  const frames: Array<{ filename: string; function?: string; lineno?: number; colno?: number }> = [];
  for (const line of lines) {
    const m = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
    if (m) {
      frames.push({
        function: m[1] ?? "<anonymous>",
        filename: m[2],
        lineno: Number(m[3]),
        colno: Number(m[4])
      });
    }
  }
  return frames.reverse();
}

export function captureError(
  error: Error | string,
  context?: Record<string, unknown>
): string {
  const isErr = error instanceof Error;
  const event: ErrorEvent = {
    id: genId(),
    timestamp: new Date(),
    level: "error",
    message: isErr ? error.message : String(error),
    stack: isErr ? error.stack : undefined,
    context,
    resolved: false
  };
  push(event);
  void sendToSentry(event);
  return event.id;
}

export function captureWarning(
  message: string,
  context?: Record<string, unknown>
): string {
  const event: ErrorEvent = {
    id: genId(),
    timestamp: new Date(),
    level: "warning",
    message,
    context,
    resolved: false
  };
  push(event);
  void sendToSentry(event);
  return event.id;
}

export function captureInfo(
  message: string,
  context?: Record<string, unknown>
): string {
  const event: ErrorEvent = {
    id: genId(),
    timestamp: new Date(),
    level: "info",
    message,
    context,
    resolved: false
  };
  push(event);
  void sendToSentry(event);
  return event.id;
}

export function getRecentErrors(limit = 100, levelFilter?: string): ErrorEvent[] {
  let items = buffer.slice().reverse();
  if (levelFilter && levelFilter !== "all") {
    items = items.filter((e) => e.level === levelFilter);
  }
  return items.slice(0, limit);
}

export function resolveError(id: string): boolean {
  const found = buffer.find((e) => e.id === id);
  if (!found) return false;
  found.resolved = true;
  return true;
}

export function getErrorStats(): {
  total: number;
  byLevel: Record<string, number>;
  unresolved: number;
} {
  const byLevel: Record<string, number> = { error: 0, warning: 0, info: 0 };
  let unresolved = 0;
  for (const e of buffer) {
    byLevel[e.level] = (byLevel[e.level] ?? 0) + 1;
    if (!e.resolved) unresolved += 1;
  }
  return { total: buffer.length, byLevel, unresolved };
}
