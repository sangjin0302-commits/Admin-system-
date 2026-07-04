import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { syncDeadlineToCalendar, isCalendarSyncConfigured } from "@/lib/services/calendar-sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SyncBody {
  caseId?: string;
  deadlineId?: string; // 여기서는 caseMatter.id 자체를 마감 식별자로 사용
  title?: string;
  date?: string;
  description?: string;
  bulk?: boolean;
}

/**
 * POST /api/admin/deadlines/sync
 *   body: { caseId, deadlineId?, title?, date? } → 특정 케이스 마감 동기
 *   body: { bulk: true } → 향후 30일 마감 전체 동기
 */
export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.deadlines.sync");
  const body = await safeReadJsonBody(request);
  if (!body.ok) return api.error(400, "잘못된 JSON 본문", { code: "BAD_JSON" });
  const payload = body.body as SyncBody;

  try {
    if (payload.bulk) {
      const now = new Date();
      const horizon = new Date(now.getTime() + 30 * 86400_000);
      const cases = await prisma.caseMatter.findMany({
        where: { dueDate: { gte: now, lte: horizon } },
        select: { id: true, caseNo: true, title: true, dueDate: true },
        take: 200,
      });
      const results: Array<{ caseId: string; ok: boolean; eventId?: string; provider: string; message?: string }> = [];
      for (const c of cases) {
        if (!c.dueDate) continue;
        const existing = await prisma.googleCalendarSyncMap
          .findUnique({
            where: { internalKind_internalId: { internalKind: "case_due", internalId: c.id } },
          })
          .catch(() => null);
        if (existing) {
          results.push({ caseId: c.id, ok: true, eventId: existing.googleEventId, provider: "google", message: "이미 동기됨" });
          continue;
        }
        const r = await syncDeadlineToCalendar(c.id, {
          title: `[마감] ${c.caseNo ? `${c.caseNo} · ` : ""}${c.title}`,
          date: c.dueDate,
          description: `Case ID: ${c.id}`,
        });
        if (r.provider === "google" && r.eventId) {
          await prisma.googleCalendarSyncMap
            .create({
              data: {
                internalKind: "case_due",
                internalId: c.id,
                googleEventId: r.eventId,
                calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
              },
            })
            .catch(() => undefined);
        }
        results.push({
          caseId: c.id,
          ok: r.provider === "google",
          eventId: r.eventId,
          provider: r.provider,
          message: r.message,
        });
      }
      return api.ok({
        ok: true,
        configured: isCalendarSyncConfigured(),
        count: results.length,
        results,
      });
    }

    if (!payload.caseId) {
      return api.error(400, "caseId 필요", { code: "MISSING_CASE_ID" });
    }
    const c = await prisma.caseMatter.findUnique({
      where: { id: payload.caseId },
      select: { id: true, caseNo: true, title: true, dueDate: true },
    });
    if (!c) return api.error(404, "사건을 찾을 수 없음", { code: "CASE_NOT_FOUND" });
    const date = payload.date ? new Date(payload.date) : c.dueDate;
    if (!date || Number.isNaN(date.getTime())) {
      return api.error(400, "유효한 마감일이 없음", { code: "MISSING_DATE" });
    }
    const title = payload.title ?? `[마감] ${c.caseNo ? `${c.caseNo} · ` : ""}${c.title}`;
    const r = await syncDeadlineToCalendar(c.id, {
      title,
      date,
      description: payload.description ?? `Case ID: ${c.id}`,
    });

    let icsFallbackUrl: string | undefined;
    if (r.provider === "google" && r.eventId) {
      await prisma.googleCalendarSyncMap
        .upsert({
          where: {
            internalKind_internalId: { internalKind: "case_due", internalId: c.id },
          },
          create: {
            internalKind: "case_due",
            internalId: c.id,
            googleEventId: r.eventId,
            calendarId: process.env.GOOGLE_CALENDAR_ID ?? "primary",
          },
          update: {
            googleEventId: r.eventId,
            lastPushedAt: new Date(),
          },
        })
        .catch(() => undefined);
    } else {
      icsFallbackUrl = `/api/admin/deadlines/ics?caseId=${encodeURIComponent(c.id)}&title=${encodeURIComponent(title)}&date=${encodeURIComponent(date.toISOString())}`;
    }

    return api.ok({
      ok: true,
      configured: isCalendarSyncConfigured(),
      eventId: r.eventId,
      provider: r.provider,
      icsFallbackUrl,
      message: r.message,
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "마감 동기 실패", { code: "DEADLINE_SYNC_FAILED" });
  }
}
