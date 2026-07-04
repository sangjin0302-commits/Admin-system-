/**
 * 화상 상담 통합 서비스.
 *
 * 우선순위:
 *   1) Zoom (JWT: ZOOM_API_KEY + ZOOM_API_SECRET)
 *   2) Google Meet (via Google Calendar API — calendar-sync 연동 재사용)
 *   3) Jitsi Meet (fallback, 항상 사용 가능)
 *
 * 환경변수:
 *   ZOOM_API_KEY, ZOOM_API_SECRET, ZOOM_USER_ID (선택; 기본 "me")
 *   GOOGLE_CALENDAR_ACCESS_TOKEN, GOOGLE_CALENDAR_ID
 *   VIDEO_MEETING_PROVIDER=zoom|google|jitsi|auto (기본 auto)
 */

import crypto from "node:crypto";
import { logger } from "@/lib/utils/logger";

export type MeetingProvider = "zoom" | "google" | "jitsi";

export type CreateMeetingInput = {
  topic: string;
  startAt: Date | string;
  durationMin: number;
  attendees?: string[]; // email addresses
};

export type MeetingResult = {
  joinUrl: string;
  hostUrl?: string;
  meetingId: string;
  provider: MeetingProvider;
  password?: string;
};

function preferredProvider(): "auto" | MeetingProvider {
  const raw = process.env.VIDEO_MEETING_PROVIDER?.trim().toLowerCase();
  if (raw === "zoom" || raw === "google" || raw === "jitsi") return raw;
  return "auto";
}

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

// ── Zoom JWT ─────────────────────────────────────────────────
function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signZoomJwt(apiKey: string, apiSecret: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const nowSec = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(JSON.stringify({ iss: apiKey, exp: nowSec + 60 * 5 }));
  const data = `${header}.${payload}`;
  const sig = crypto.createHmac("sha256", apiSecret).update(data).digest();
  return `${data}.${base64UrlEncode(sig)}`;
}

async function createZoomMeeting(input: CreateMeetingInput): Promise<MeetingResult | null> {
  const apiKey = process.env.ZOOM_API_KEY?.trim();
  const apiSecret = process.env.ZOOM_API_SECRET?.trim();
  if (!apiKey || !apiSecret) return null;

  const userId = process.env.ZOOM_USER_ID?.trim() || "me";
  const token = signZoomJwt(apiKey, apiSecret);
  const startIso = toDate(input.startAt).toISOString();

  try {
    const res = await fetch(`https://api.zoom.us/v2/users/${encodeURIComponent(userId)}/meetings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: input.topic.slice(0, 200),
        type: 2, // scheduled
        start_time: startIso,
        duration: Math.max(15, Math.min(480, Math.floor(input.durationMin))),
        timezone: "Asia/Seoul",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          waiting_room: false,
          approval_type: 2,
        },
      }),
    });
    if (!res.ok) {
      logger.warn("[video-meeting] zoom api failed", { status: res.status });
      return null;
    }
    const data = (await res.json()) as {
      id?: number | string;
      join_url?: string;
      start_url?: string;
      password?: string;
    };
    if (!data.join_url || !data.id) return null;
    return {
      joinUrl: data.join_url,
      hostUrl: data.start_url,
      meetingId: String(data.id),
      provider: "zoom",
      password: data.password,
    };
  } catch (err) {
    logger.warn("[video-meeting] zoom exception", err);
    return null;
  }
}

// ── Google Calendar Meet ─────────────────────────────────────
async function createGoogleMeetMeeting(input: CreateMeetingInput): Promise<MeetingResult | null> {
  const token = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN?.trim();
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim() || "primary";
  if (!token) return null;

  const start = toDate(input.startAt);
  const end = new Date(start.getTime() + Math.max(15, input.durationMin) * 60_000);
  const requestId = crypto.randomBytes(8).toString("hex");

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: input.topic.slice(0, 200),
          start: { dateTime: start.toISOString(), timeZone: "Asia/Seoul" },
          end: { dateTime: end.toISOString(), timeZone: "Asia/Seoul" },
          attendees: (input.attendees || []).filter(Boolean).map((email) => ({ email })),
          conferenceData: {
            createRequest: {
              requestId,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      }
    );
    if (!res.ok) {
      logger.warn("[video-meeting] google api failed", { status: res.status });
      return null;
    }
    const data = (await res.json()) as {
      id?: string;
      hangoutLink?: string;
      htmlLink?: string;
      conferenceData?: { entryPoints?: Array<{ uri?: string; entryPointType?: string }> };
    };
    const meetUrl =
      data.hangoutLink ??
      data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
      null;
    if (!meetUrl || !data.id) return null;
    return {
      joinUrl: meetUrl,
      hostUrl: data.htmlLink,
      meetingId: data.id,
      provider: "google",
    };
  } catch (err) {
    logger.warn("[video-meeting] google exception", err);
    return null;
  }
}

// ── Jitsi fallback ───────────────────────────────────────────
function createJitsiMeeting(input: CreateMeetingInput): MeetingResult {
  const id = crypto.randomUUID();
  const room = `ETHOS-${id.slice(0, 8)}`;
  const url = `https://meet.jit.si/${room}#config.prejoinPageEnabled=true`;
  void input;
  return {
    joinUrl: url,
    meetingId: room,
    provider: "jitsi",
  };
}

// ── Main entry ───────────────────────────────────────────────
export async function createMeeting(input: CreateMeetingInput): Promise<MeetingResult> {
  const pref = preferredProvider();
  const order: MeetingProvider[] =
    pref === "auto" ? ["zoom", "google", "jitsi"] : [pref, ...(["zoom", "google", "jitsi"].filter((p) => p !== pref) as MeetingProvider[])];

  for (const provider of order) {
    if (provider === "zoom") {
      const r = await createZoomMeeting(input);
      if (r) return r;
    } else if (provider === "google") {
      const r = await createGoogleMeetMeeting(input);
      if (r) return r;
    } else {
      return createJitsiMeeting(input);
    }
  }
  return createJitsiMeeting(input);
}
