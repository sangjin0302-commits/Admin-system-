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

async function sendToSentry(event: ErrorEvent): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    await fetch(dsn, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: event.id,
        timestamp: event.timestamp.toISOString(),
        level: event.level,
        message: event.message,
        stack: event.stack,
        extra: event.context
      })
    });
  } catch {
    // best-effort
  }
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
