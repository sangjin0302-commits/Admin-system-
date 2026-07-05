import { NextResponse } from "next/server";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  draftSchedulingSession,
  getSchedulingSession,
  sendSchedulingEmail
} from "@/lib/services/scheduling-bot-service";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.schedule.get");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) return api.error(400, "잘못된 문의 ID입니다.", { code: "INVALID_INQUIRY_ID" });
  const session = await getSchedulingSession(id);
  return NextResponse.json({ ok: true, session });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.schedule.post");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) return api.error(400, "잘못된 문의 ID입니다.", { code: "INVALID_INQUIRY_ID" });

  const body = await safeReadJsonBody(request);
  if (!body.ok) return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  const payload = (body.body ?? {}) as { action?: string };

  try {
    switch (payload.action) {
      case "draft": {
        const session = await draftSchedulingSession(id);
        return NextResponse.json({ ok: true, session });
      }
      case "send": {
        const session = await sendSchedulingEmail(id);
        return NextResponse.json({ ok: true, session });
      }
      default:
        return api.error(400, "지원하지 않는 action.", { code: "INVALID_ACTION" });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return api.error(404, error.message, { code: "NOT_FOUND" });
    }
    api.logError(error);
    return api.error(500, "일정 조율 처리에 실패했습니다.", { code: "SCHEDULING_FAILED" });
  }
}
