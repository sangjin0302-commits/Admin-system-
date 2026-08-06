/**
 * 사건 상태 변경 알림 — 단일 정본 서비스.
 *
 * 두 가지 진입점을 제공한다(동작은 각각 기존과 동일하게 보존):
 * 1. notifyClientCaseStatusChanged(caseId, newStatus)
 *    - inquiry.email 기준, 템플릿 기반(sendClientNotification) 이메일 + 포털 알림
 *    - NOTIFICATION_PROVIDER=none 인 경우 dry-run 로그만
 *    - best-effort: 실패해도 case 업데이트는 막지 않음
 * 2. notifyCaseStatusChange(caseId, oldStatus, newStatus)
 *    - feature flag(case_progress_notify) 게이트 + 전환 메시지 HTML 이메일(sendEmail) + 포털 알림
 *
 * STATUS_LABELS 는 두 경로가 공유하는 단일 소스.
 */

import { prisma } from "@/lib/prisma/client";
import { sendClientNotification } from "@/lib/services/client-notifications";
import { sendEmail } from "@/lib/services/email-service";
import { createPortalNotification } from "@/lib/services/portal-notifications";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

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
    logger.debug("[case-status-notify] no email — skip", caseMatterId);
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
    logger.warn("[case-status-notify] portal notification failed", error);
  }
}

function composeStatusChangeMessage(
  caseTitle: string,
  caseNo: string | null,
  oldStatus: string,
  newStatus: string
): { subject: string; body: string } {
  const oldLabel = STATUS_LABELS[oldStatus] ?? oldStatus;
  const newLabel = STATUS_LABELS[newStatus] ?? newStatus;
  const caseRef = caseNo ?? caseTitle;

  return {
    subject: `[ETHOS] 사건 상태 변경 안내 — ${caseRef}`,
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">사건 진행 상태가 변경되었습니다</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; color: #666;">사건</td>
            <td style="padding: 8px; font-weight: bold;">${caseRef}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #666;">이전 상태</td>
            <td style="padding: 8px;">${oldLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #666;">현재 상태</td>
            <td style="padding: 8px; font-weight: bold; color: #2563eb;">${newLabel}</td>
          </tr>
        </table>
        <p style="color: #666; font-size: 14px;">
          자세한 내용은 포털에서 확인하실 수 있습니다.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">ETHOS 행정사사무소</p>
      </div>
    `,
  };
}

/**
 * feature flag(case_progress_notify) 게이트 하에 oldStatus → newStatus 전환을
 * HTML 이메일 + 포털 알림으로 발송. (구 case-progress-notify-service.ts 동작 보존)
 */
export async function notifyCaseStatusChange(
  caseId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  const enabled = await isFeatureEnabled("case_progress_notify").catch(() => false);
  if (!enabled) {
    logger.debug("[case-progress-notify] flag disabled — skip");
    return;
  }

  const caseMatter = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      caseNo: true,
      title: true,
      inquiry: {
        select: {
          contactName: true,
          email: true,
        },
      },
    },
  });

  if (!caseMatter?.inquiry?.email) {
    logger.debug("[case-progress-notify] no email — skip", caseId);
    return;
  }

  const { subject, body } = composeStatusChangeMessage(
    caseMatter.title,
    caseMatter.caseNo,
    oldStatus,
    newStatus
  );

  // 이메일 발송
  try {
    await sendEmail({
      to: caseMatter.inquiry.email,
      subject,
      html: body,
    });
  } catch (error) {
    logger.warn("[case-progress-notify] email failed", error);
  }

  // 포털 알림
  try {
    const portalClient = await prisma.portalClient.findUnique({
      where: { email: caseMatter.inquiry.email },
      select: { id: true },
    });
    if (portalClient) {
      const newLabel = STATUS_LABELS[newStatus] ?? newStatus;
      await createPortalNotification({
        clientId: portalClient.id,
        caseId,
        event: "case_progress_changed",
        title: `사건 상태 변경: ${newLabel}`,
        body: `${caseMatter.caseNo ?? caseMatter.title} — 상태가 '${newLabel}'(으)로 변경되었습니다.`,
        link: `/portal/cases/${caseId}`,
      });
    }
  } catch (error) {
    logger.warn("[case-progress-notify] portal notification failed", error);
  }
}
