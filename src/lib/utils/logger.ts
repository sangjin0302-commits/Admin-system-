import { captureError } from "@/lib/services/error-monitor-service";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function minLevel(): number {
  return process.env.NODE_ENV === "production" ? LEVEL_ORDER.warn : LEVEL_ORDER.debug;
}

function format(level: LogLevel, msg: string, ctx?: LogContext): string {
  const ts = new Date().toISOString();
  const tag = `[${level.toUpperCase()}]`;
  const ctxStr = ctx && Object.keys(ctx).length > 0 ? ` | ${JSON.stringify(ctx)}` : "";
  return `${tag} ${ts} | ${msg}${ctxStr}`;
}

function emit(level: LogLevel, msg: string, ctx?: LogContext): void {
  if (LEVEL_ORDER[level] < minLevel()) return;
  const line = format(level, msg, ctx);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(line);
  } else if (level === "info") {
    // eslint-disable-next-line no-console
    console.info(line);
  } else {
    // eslint-disable-next-line no-console
    console.debug(line);
  }
}

function toCtx(arg: unknown): LogContext | undefined {
  if (arg === undefined || arg === null) return undefined;
  if (typeof arg === "object" && !Array.isArray(arg) && !(arg instanceof Error)) {
    return arg as LogContext;
  }
  if (arg instanceof Error) {
    return { error: arg.message, stack: arg.stack };
  }
  return { detail: arg };
}

export const logger = {
  debug(msg: string, ...extra: unknown[]): void {
    emit("debug", msg, extra.length === 0 ? undefined : extra.length === 1 ? toCtx(extra[0]) : { extra });
  },
  info(msg: string, ...extra: unknown[]): void {
    emit("info", msg, extra.length === 0 ? undefined : extra.length === 1 ? toCtx(extra[0]) : { extra });
  },
  warn(msg: string, ...extra: unknown[]): void {
    emit("warn", msg, extra.length === 0 ? undefined : extra.length === 1 ? toCtx(extra[0]) : { extra });
  },
  error(msg: string, err?: unknown, ...rest: unknown[]): void {
    let ctx: LogContext | undefined;
    if (rest.length === 1) {
      ctx = toCtx(rest[0]);
    } else if (rest.length > 1) {
      ctx = { extra: rest };
    }
    const errInfo: LogContext = { ...(ctx ?? {}) };
    let errObj: Error | undefined;
    if (err instanceof Error) {
      errObj = err;
      errInfo.error = err.message;
      if (err.stack) errInfo.stack = err.stack;
    } else if (err !== undefined) {
      errInfo.error = String(err);
    }
    emit("error", msg, errInfo);
    if (process.env.SENTRY_DSN) {
      try {
        captureError(errObj ?? msg, { message: msg, ...(ctx ?? {}) });
      } catch {
        // best-effort
      }
    }
  }
};
