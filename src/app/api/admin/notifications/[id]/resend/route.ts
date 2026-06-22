import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import {
  requireRole,
  logAdminAudit,
  ipFromRequest,
} from "@/lib/services/admin-rbac-service";
import { sendKakaoAlimtalk } from "@/lib/services/kakao-notification-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.notifications.resend");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const original = await prisma.notificationLog
    .findUnique({ where: { id } })
    .catch(() => null);
  if (!original) {
    return api.error(404, "알림을 찾을 수 없습니다.", { code: "NOTIF_NOT_FOUND" });
  }

  if (original.channel !== "ALIMTALK") {
    return api.error(400, "현재는 알림톡만 재발송 지원합니다.", {
      code: "RESEND_UNSUPPORTED_CHANNEL",
    });
  }

  const variables: Record<string, string> = (() => {
    try {
      return original.variables ? JSON.parse(original.variables) : {};
    } catch {
      return {};
    }
  })();

  const ok = await sendKakaoAlimtalk(
    {
      to: original.recipient,
      templateId: original.templateId ?? "",
      variables,
      caseId: original.caseId ?? undefined,
    },
    original.body ?? undefined
  );

  await logAdminAudit({
    actorEmail: guard.user.email,
    actorRole: guard.user.role,
    action: "ALIMTALK_SEND",
    resource: "NotificationLog.resend",
    resourceId: id,
    details: {
      ok,
      originalStatus: original.status,
      templateId: original.templateId,
    },
    ip: ipFromRequest(req),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    sent: ok,
    message: ok ? "재발송 성공 (NotificationLog 새 항목 생성됨)" : "재발송 실패 — 로그 확인",
  });
}
