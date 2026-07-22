import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { logAudit } from "@/lib/services/audit-log";
import { sendClientNotification } from "@/lib/services/client-notifications";
import { createPortalNotification } from "@/lib/services/portal-notifications";

/**
 * 관리자가 의뢰인에게 메시지 전송.
 * - 포털 알림센터에 기록 (의뢰인이 포털 가입돼 있으면)
 * - 이메일도 best-effort 발송
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!title || !message) {
    return NextResponse.json({ ok: false, error: "제목과 내용을 입력해 주세요." }, { status: 400 });
  }

  try {
    const caseMatter = await prisma.caseMatter.findUnique({
      where: { id },
      select: {
        caseNo: true,
        title: true,
        inquiry: { select: { email: true, contactName: true, publicTrackingCode: true } }
      }
    });
    if (!caseMatter) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const email = caseMatter.inquiry?.email;
    let portalDelivered = false;

    // 포털 알림센터
    if (email) {
      const portalClient = await prisma.portalClient.findUnique({
        where: { email },
        select: { id: true }
      });
      if (portalClient) {
        await createPortalNotification({
          clientId: portalClient.id,
          caseId: id,
          event: "message",
          title,
          body: message,
          link: `/portal/cases/${id}`
        });
        portalDelivered = true;
      }
    }

    // 이메일 best-effort
    if (email) {
      await sendClientNotification({
        event: "case_status_changed",
        toEmail: email,
        toName: caseMatter.inquiry?.contactName ?? "고객",
        trackingCode: caseMatter.inquiry?.publicTrackingCode ?? undefined,
        variables: {
          caseNo: caseMatter.caseNo ?? "-",
          caseTitle: caseMatter.title,
          newStatus: title,
          nextAction: message
        }
      }).catch(() => undefined);
    }

    await logAudit({
      event: "admin.client_message",
      caseId: id,
      actorId: null,
      actorName: "관리자",
      message: `의뢰인에게 메시지 전송: ${title}`,
      payload: { portalDelivered, hasEmail: !!email }
    });

    return NextResponse.json({ ok: true, portalDelivered, emailAttempted: !!email });
  } catch (error) {
    console.error("admin/case-matters/[id]/message POST failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
