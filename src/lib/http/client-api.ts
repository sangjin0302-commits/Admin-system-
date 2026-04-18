export type ClientApiErrorPayload = {
  error?: string;
  requestId?: string;
  blockers?: string[];
  code?: string;
};

const REQUEST_ID_HEADER_KEYS = ["X-Admin-Request-Id", "X-Request-Id"] as const;

function getRequestIdFromHeaders(response: Response) {
  for (const header of REQUEST_ID_HEADER_KEYS) {
    const value = response.headers.get(header);
    if (value) return value;
  }
  return undefined;
}

function getCurrentUpdatedAtFromHeaders(response: Response) {
  return response.headers.get("X-Current-Updated-At") ?? undefined;
}

function formatCurrentUpdatedAt(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export async function parseClientApiError(
  response: Response,
  fallbackMessage: string
) {
  const payload = (await response.json().catch(() => null)) as ClientApiErrorPayload | null;
  const requestId = payload?.requestId ?? getRequestIdFromHeaders(response);
  const currentUpdatedAt = formatCurrentUpdatedAt(getCurrentUpdatedAtFromHeaders(response));

  const conflictMessage =
    payload?.code === "CONCURRENT_UPDATE_CONFLICT"
      ? currentUpdatedAt
        ? `${payload.error ?? fallbackMessage} (서버 최신 시각: ${currentUpdatedAt})`
        : payload.error ?? fallbackMessage
      : undefined;
  const baseMessage = conflictMessage ?? payload?.error ?? fallbackMessage;
  const blockerText = payload?.blockers?.length ? ` ${payload.blockers.join(" ")}` : "";
  return requestId
    ? `${baseMessage}${blockerText} (request ID: ${requestId})`
    : `${baseMessage}${blockerText}`;
}
