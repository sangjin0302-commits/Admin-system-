export const AB_COOKIE_NAME = "ethos_ab";

export function parseAbCookie(
  cookieValue: string | null | undefined
): Record<string, string> {
  if (!cookieValue) return {};
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return {};
  }
}

export function serializeAbCookie(
  assignments: Record<string, string>
): string {
  return encodeURIComponent(JSON.stringify(assignments));
}
