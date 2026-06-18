/**
 * 사건 상태 변경 → 의뢰인 자동 이메일 알림.
 * - inquiry.email 기준
 * - NOTIFICATION_PROVIDER=none 인 경우 dry-run 로그만
 * - best-effort: 실패해도 case 업데이트는 막지 않음
 */

import { prisma } from "@/lib/prisma/client";
import { sendClientNotification } from "@/lib/services/client-notifications";
import { createPortalNotification } from "@/lib/services/portal-notifications";

const STATUS_LABELS: Record<string, string> = {
  INTAKE_REVIEW: "접수 검토 중",
  CONSULTING: "상담 중",
  QUOTED: "견적 안내됨",
  CONTRACT_PENDING: "계약 준비 중",
  OPEN: "사건 개시",
  DOCUMENT_COLLECTING: "자료 수집 중",
  DOCUMENT_REVIEWING: "자료 검토 중",
  READY_TO_SUBMIT: "제출 준비 완료",
  SUBMITTED: "기관 제출 완료",
  SUPPLEMENT_REQUESTED: "보완 요청 받음",
  WAITING_AGENCY: "기관 처리 대기",
  RESULT_RECEIVED: "결과 통보 받음",
  CLOSING: "사건 마무리 중",
  CLOSED: "사건 종결",
  CANCELLED: "사건 취소",
  ON_HOLD: "보류"
};

export async function notifyClientCaseStatusChanged(
  caseMatterId: string,
  newStatus: string
): Promise<void> {
  const caseMatter = await prisma.caseMatter.findUnique({
    where: { id: caseMatterId },
    select: {
      caseNo: true,
      title: true,
      summary: true,
      nextActionAt: true,
      inquiry: {
        select: {
          contactName: true,
          email: true,
          publicTrackingCode: true
        }
      }
    }
  });

  const email = caseMatter?.inquiry?.email;
  if (!caseMatter || !caseMatter.inquiry || !email) {
    console.log("[case-status-notify] no email — skip", caseMatterId);
    return;
  }

  const statusLabel = STATUS_LABELS[newStatus] ?? newStatus;

  // 이메일 발송 (best-effort)
  await sendClientNotification({
    event: "case_status_changed",
    toEmail: email,
    toName: caseMatter.inquiry.contactName,
    trackingCode: caseMatter.inquiry.publicTrackingCode ?? undefined,
    variables: {
      caseNo: caseMatter.caseNo ?? "-",
      caseTitle: caseMatter.title,
      newStatus: statusLabel,
      nextAction: caseMatter.nextActionAt
        ? caseMatter.nextActionAt.toISOString().slice(0, 10)
        : "사무소에서 다음 안내 예정"
    }
  });

  // 포털 알림 inbox에도 기록 (의뢰인이 포털 가입돼 있으면)
  try {
    const portalClient = await prisma.portalClient.findUnique({
      where: { email },
      select: { id: true }
    });
    if (portalClient) {
      await createPortalNotification({
        clientId: portalClient.id,
        caseId: caseMatterId,
        event: "case_status_changed",
        title: `사건 상태 업데이트: ${statusLabel}`,
        body: `${caseMatter.caseNo ?? caseMatter.title} — 상태가 '${statusLabel}'로 변경되었습니다.`,
        link: `/portal/cases/${caseMatterId}`
      });
    }
  } catch (error) {
    console.warn("[case-status-notify] portal notification failed", error);
  }
}
