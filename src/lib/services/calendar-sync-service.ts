/**
 * Deadline → Google Calendar sync (service-account 방식).
 *
 * 기존 `google-calendar-sync-service.ts`는 OAuth 사용자 토큰을 사용하지만,
 * 이 서비스는 서비스 계정(GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_CALENDAR_ID) 기반 서버 자동 동기용.
 * 미설정 시 .ics 다운로드 URL로 폴백.
 */

import { logger } from "@/lib/utils/logger";

export interface DeadlineInput {
  title: string;
  date: Date;
  description?: string;
  location?: string;
}

export interface SyncResult {
  eventId?: string;
  icsUrl?: string;
  provider: "google" | "ics";
  message?: string;
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function isConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID?.trim() && process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  );
}

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const decoded = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const obj = JSON.parse(decoded) as ServiceAccount;
    if (!obj.client_email || !obj.private_key) return null;
    return obj;
  } catch (err) {
    logger.warn("[calendar-sync] service account parse failed", err);
    return null;
  }
}

// ---------- JWT (RS256) — minimal implementation (no external deps) ----------

function base64urlEncode(buf: Uint8Array | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf-8") : Buffer.from(buf);
  return b.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function signJwt(sa: ServiceAccount, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope,
    aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const encHeader = base64urlEncode(JSON.stringify(header));
  const encPayload = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${encHeader}.${encPayload}`;

  const { createSign } = await import("crypto");
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer.sign(sa.private_key);
  const encSig = base64urlEncode(signature);
  return `${signingInput}.${encSig}`;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(sa: ServiceAccount): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  try {
    const jwt = await signJwt(sa, "https://www.googleapis.com/auth/calendar");
    const res = await fetch(sa.token_uri ?? "https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn("[calendar-sync] token request failed", res.status, body.slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return data.access_token;
  } catch (err) {
    logger.warn("[calendar-sync] token exception", err);
    return null;
  }
}

// ---------- ICS fallback ----------

function formatICSDate(d: Date): string {
  return (
    d.getUTCFullYear().toString().padStart(4, "0") +
    (d.getUTCMonth() + 1).toString().padStart(2, "0") +
    d.getUTCDate().toString().padStart(2, "0") +
    "T" +
    d.getUTCHours().toString().padStart(2, "0") +
    d.getUTCMinutes().toString().padStart(2, "0") +
    d.getUTCSeconds().toString().padStart(2, "0") +
    "Z"
  );
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildDeadlineICS(caseId: string, deadline: DeadlineInput): string {
  const end = new Date(deadline.date.getTime() + 60 * 60 * 1000);
  const uid = `deadline-${caseId}-${deadline.date.getTime()}@ethos.local`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ETHOS//Deadline Sync//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(deadline.date)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeICS(deadline.title)}`,
    ...(deadline.description ? [`DESCRIPTION:${escapeICS(deadline.description)}`] : []),
    ...(deadline.location ? [`LOCATION:${escapeICS(deadline.location)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeICS(deadline.title)}`,
    "TRIGGER:-PT60M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// ---------- Public API ----------

export async function syncDeadlineToCalendar(
  caseId: string,
  deadline: DeadlineInput
): Promise<SyncResult> {
  if (!isConfigured()) {
    return {
      provider: "ics",
      icsUrl: `/api/admin/deadlines/ics?caseId=${encodeURIComponent(caseId)}&title=${encodeURIComponent(
        deadline.title
      )}&date=${encodeURIComponent(deadline.date.toISOString())}`,
      message: "Google Calendar 서비스 계정 미설정. .ics 파일 폴백.",
    };
  }
  const sa = readServiceAccount();
  if (!sa) {
    return { provider: "ics", message: "서비스 계정 JSON 파싱 실패" };
  }
  const token = await getAccessToken(sa);
  if (!token) {
    return { provider: "ics", message: "액세스 토큰 획득 실패" };
  }
  const calendarId = process.env.GOOGLE_CALENDAR_ID!.trim();
  const end = new Date(deadline.date.getTime() + 60 * 60 * 1000);
  const body = {
    summary: deadline.title,
    description: deadline.description ?? `Case ${caseId} 마감`,
    location: deadline.location,
    start: { dateTime: deadline.date.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 60 }],
    },
    extendedProperties: {
      private: { ethosCaseId: caseId, ethosSource: "calendar-sync-service" },
    },
  };
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      logger.warn("[calendar-sync] insert failed", res.status, errBody.slice(0, 200));
      return { provider: "ics", message: `Google insert 실패 (${res.status})` };
    }
    const data = (await res.json()) as { id?: string };
    if (!data.id) return { provider: "ics", message: "이벤트 ID 누락" };
    return { provider: "google", eventId: data.id };
  } catch (err) {
    logger.warn("[calendar-sync] exception", err);
    return { provider: "ics", message: "동기 예외" };
  }
}

export async function removeCalendarEvent(eventId: string): Promise<{ ok: boolean; message?: string }> {
  if (!isConfigured()) return { ok: false, message: "미설정" };
  const sa = readServiceAccount();
  if (!sa) return { ok: false, message: "서비스 계정 파싱 실패" };
  const token = await getAccessToken(sa);
  if (!token) return { ok: false, message: "토큰 실패" };
  const calendarId = process.env.GOOGLE_CALENDAR_ID!.trim();
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok || res.status === 204 || res.status === 410) return { ok: true };
    return { ok: false, message: `HTTP ${res.status}` };
  } catch (err) {
    logger.warn("[calendar-sync] delete exception", err);
    return { ok: false, message: "예외" };
  }
}

export function isCalendarSyncConfigured(): boolean {
  return isConfigured();
}
