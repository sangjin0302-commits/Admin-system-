/**
 * Google Calendar 양방향 동기 — 사건 마감/다음액션/작업 → Google.
 *
 * 흐름:
 *   1) DB에서 향후 90일 사건/작업 추출
 *   2) GoogleCalendarSyncMap 으로 기존 매핑 확인
 *   3) 새 항목: events.insert / 기존: events.patch / 삭제된 내부: events.delete
 *   4) 결과를 GoogleOAuthToken.lastSyncedAt 에 기록
 *
 * Google Calendar API: https://developers.google.com/calendar/api/v3/reference/events
 */

import { prisma } from "@/lib/prisma/client";
import { getValidAccessToken } from "@/lib/services/google-oauth-service";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

const GCAL_BASE = "https://www.googleapis.com/calendar/v3";

interface InternalEvent {
  kind: "case_due" | "case_next_action" | "task";
  internalId: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  caseId?: string;
}

async function collectInternalEvents(): Promise<InternalEvent[]> {
  const now = new Date();
  const horizon = new Date(now.getTime() + 90 * 86400_000);
  const events: InternalEvent[] = [];

  const cases = await prisma.caseMatter
    .findMany({
      where: {
        OR: [
          { dueDate: { gte: now, lte: horizon } },
          { nextActionAt: { gte: now, lte: horizon } },
        ],
      },
      select: {
        id: true,
        caseNo: true,
        title: true,
        dueDate: true,
        nextActionAt: true,
      },
      take: 500,
    })
    .catch(() => []);

  for (const c of cases) {
    if (c.dueDate) {
      events.push({
        kind: "case_due",
        internalId: c.id,
        summary: `[마감] ${c.caseNo ? `${c.caseNo} · ` : ""}${c.title}`,
        description: `Case ID: ${c.id}`,
        start: c.dueDate,
        end: new Date(c.dueDate.getTime() + 60 * 60_000),
        caseId: c.id,
      });
    }
    if (c.nextActionAt) {
      events.push({
        kind: "case_next_action",
        internalId: c.id,
        summary: `[다음 액션] ${c.title}`,
        start: c.nextActionAt,
        end: new Date(c.nextActionAt.getTime() + 30 * 60_000),
        caseId: c.id,
      });
    }
  }

  const tasks = await prisma.caseTask
    .findMany({
      where: { dueDate: { gte: now, lte: horizon } },
      select: { id: true, title: true, dueDate: true, caseId: true },
      take: 500,
    })
    .catch(() => []);

  for (const t of tasks) {
    if (!t.dueDate) continue;
    events.push({
      kind: "task",
      internalId: t.id,
      summary: `[작업] ${t.title}`,
      start: t.dueDate,
      end: new Date(t.dueDate.getTime() + 30 * 60_000),
      caseId: t.caseId ?? undefined,
    });
  }

  return events;
}

function toGcalEvent(ev: InternalEvent) {
  return {
    summary: ev.summary,
    description: ev.description,
    start: { dateTime: ev.start.toISOString() },
    end: { dateTime: ev.end.toISOString() },
    extendedProperties: {
      private: {
        ethosKind: ev.kind,
        ethosInternalId: ev.internalId,
        ...(ev.caseId ? { ethosCaseId: ev.caseId } : {}),
      },
    },
  };
}

export interface SyncResult {
  pushed: number;
  updated: number;
  skipped: number;
  errors: number;
}

export async function syncToGoogleCalendar(
  userId: string = "default-admin"
): Promise<SyncResult & { ok: boolean; message?: string }> {
  const token = await getValidAccessToken(userId);
  if (!token) {
    return {
      ok: false,
      message: "Google OAuth 미연결 또는 토큰 만료",
      pushed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };
  }
  const tokenRow = await prisma.googleOAuthToken
    .findUnique({ where: { userId }, select: { calendarId: true } })
    .catch(() => null);
  const calendarId = tokenRow?.calendarId ?? "primary";

  const events = await collectInternalEvents();
  const result: SyncResult = { pushed: 0, updated: 0, skipped: 0, errors: 0 };

  for (const ev of events) {
    try {
      const mapping = await prisma.googleCalendarSyncMap
        .findUnique({
          where: {
            internalKind_internalId: {
              internalKind: ev.kind,
              internalId: ev.internalId,
            },
          },
        })
        .catch(() => null);

      const body = JSON.stringify(toGcalEvent(ev));
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (mapping) {
        const res = await fetch(
          `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(mapping.googleEventId)}`,
          { method: "PATCH", headers, body }
        );
        if (res.ok) {
          await prisma.googleCalendarSyncMap.update({
            where: { id: mapping.id },
            data: { lastPushedAt: new Date() },
          });
          result.updated++;
        } else if (res.status === 404 || res.status === 410) {
          // gone — recreate
          await prisma.googleCalendarSyncMap.delete({ where: { id: mapping.id } });
          const created = await fetch(
            `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
            { method: "POST", headers, body }
          );
          if (created.ok) {
            const data = (await created.json()) as { id?: string };
            if (data.id) {
              await prisma.googleCalendarSyncMap.create({
                data: {
                  internalKind: ev.kind,
                  internalId: ev.internalId,
                  googleEventId: data.id,
                  calendarId,
                },
              });
              result.pushed++;
            }
          } else {
            result.errors++;
          }
        } else {
          result.errors++;
        }
      } else {
        const created = await fetch(
          `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
          { method: "POST", headers, body }
        );
        if (created.ok) {
          const data = (await created.json()) as { id?: string };
          if (data.id) {
            await prisma.googleCalendarSyncMap.create({
              data: {
                internalKind: ev.kind,
                internalId: ev.internalId,
                googleEventId: data.id,
                calendarId,
              },
            });
            result.pushed++;
          } else {
            result.skipped++;
          }
        } else {
          result.errors++;
        }
      }
    } catch (err) {
      captureError(err instanceof Error ? err : new Error(String(err)), {
        kind: ev.kind,
        internalId: ev.internalId,
      });
      result.errors++;
    }
  }

  await prisma.googleOAuthToken
    .updateMany({ where: { userId }, data: { lastSyncedAt: new Date() } })
    .catch(() => undefined);

  logger.info("[google-cal-sync]", result);
  return { ok: true, ...result };
}

// ---------------------------------------------------------------------------
// Google Meet — 단발성 이벤트 + 화상회의 링크 생성 (기존 동기와 무관, 독립 함수)
// ---------------------------------------------------------------------------

/** 결정적 requestId — summary + start ISO 로부터 파생(Date.now/Math.random 금지). */
function deriveMeetRequestId(summary: string, startIso: string): string {
  const seed = `${summary}|${startIso}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return `ethos-meet-${(hash >>> 0).toString(36)}`;
}

/**
 * Google Meet 링크가 포함된 캘린더 이벤트를 생성한다.
 * 미연결·실패 시 null (throw 안 함).
 */
export async function createCalendarEventWithMeet(params: {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  calendarId?: string;
  userId?: string;
}): Promise<{ eventId: string; htmlLink?: string; meetLink?: string } | null> {
  const token = await getValidAccessToken(params.userId);
  if (!token) {
    logger.warn("[google-meet] createCalendarEventWithMeet: no token (미연결)");
    return null;
  }

  try {
    const calendarId = params.calendarId || "primary";
    const startIso = params.start.toISOString();
    const requestId = deriveMeetRequestId(params.summary, startIso);

    const body = {
      summary: params.summary,
      description: params.description,
      start: { dateTime: startIso },
      end: { dateTime: params.end.toISOString() },
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const res = await fetch(
      `${GCAL_BASE}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
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
      logger.warn("[google-meet] event create failed", res.status);
      return null;
    }

    const data = (await res.json()) as {
      id?: string;
      htmlLink?: string;
      hangoutLink?: string;
      conferenceData?: {
        entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
      };
    };
    if (!data.id) return null;

    const videoEntry = data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    );
    const meetLink = data.hangoutLink ?? videoEntry?.uri;

    return { eventId: data.id, htmlLink: data.htmlLink, meetLink };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      scope: "google-meet:createCalendarEventWithMeet",
      summary: params.summary,
    });
    return null;
  }
}
