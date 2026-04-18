import { NextResponse } from "next/server";
import { ZodError } from "zod";

type AdminErrorPayload = {
  ok: false;
  error: string;
  requestId: string;
  code?: string;
  blockers?: string[];
};

function makeRequestId() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ADM-${now}-${rand}`;
}

function appendRequestIdHeader(
  init: ResponseInit | undefined,
  requestId: string,
  contentType?: string
): ResponseInit {
  const headers = new Headers(init?.headers);
  headers.set("X-Admin-Request-Id", requestId);
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  return {
    ...init,
    headers
  };
}

export function createAdminRequestContext(label: string) {
  const requestId = makeRequestId();

  function logError(error: unknown) {
    console.error(`[${label}] requestId=${requestId}`, error);
  }

  function ok<T>(payload: T, init?: ResponseInit) {
    return NextResponse.json(
      payload,
      appendRequestIdHeader(init, requestId)
    );
  }

  function error(
    status: number,
    message: string,
    options?: {
      code?: string;
      blockers?: string[];
      headers?: HeadersInit;
    }
  ) {
    const payload: AdminErrorPayload = {
      ok: false,
      error: message,
      requestId,
      code: options?.code,
      blockers: options?.blockers
    };
    return NextResponse.json(
      payload,
      appendRequestIdHeader({ status, headers: options?.headers }, requestId)
    );
  }

  function text(body: string, init?: ResponseInit, contentType = "text/plain; charset=utf-8") {
    return new NextResponse(body, appendRequestIdHeader(init, requestId, contentType));
  }

  return {
    requestId,
    logError,
    ok,
    error,
    text
  };
}

export async function safeReadJsonBody(request: Request) {
  try {
    const body = await request.json();
    return {
      ok: true as const,
      body
    };
  } catch {
    return {
      ok: false as const
    };
  }
}

export function firstZodMessage(error: ZodError, fallback: string) {
  return error.issues[0]?.message ?? fallback;
}
