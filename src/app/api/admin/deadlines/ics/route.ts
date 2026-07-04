import { createAdminRequestContext } from "@/lib/http/admin-api";
import { buildDeadlineICS } from "@/lib/services/calendar-sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/deadlines/ics?caseId=&title=&date=
 * .ics 파일 반환 (Google Calendar 미설정 시 폴백)
 */
export async function GET(request: Request) {
  const api = createAdminRequestContext("admin.deadlines.ics");
  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId") ?? "unknown";
  const title = url.searchParams.get("title") ?? "마감";
  const dateStr = url.searchParams.get("date");
  const description = url.searchParams.get("description") ?? undefined;
  if (!dateStr) return api.error(400, "date 필수", { code: "MISSING_DATE" });
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return api.error(400, "date 형식 오류", { code: "BAD_DATE" });

  const ics = buildDeadlineICS(caseId, { title, date, description });
  return api.text(ics, {
    headers: {
      "Content-Disposition": `attachment; filename="deadline-${caseId}.ics"`,
    },
  }, "text/calendar; charset=utf-8");
}
