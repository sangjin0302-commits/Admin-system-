/**
 * 의뢰인 알림 스캐폴드
 *
 * 운영 시 다음 채널 중 선택해 연동:
 * - Resend (https://resend.com)  - 이메일, 권장
 * - AWS SES                       - 이메일, 대용량
 * - 카카오 알림톡 (NHN, Aligo 등) - 한국 사용자 권장
 * - 솔라피 (SOLAPI)               - SMS / 알림톡 통합
 *
 * env: NOTIFICATION_PROVIDER=resend|ses|aligo|none (default: none)
 */

export type NotificationChannel = "email" | "sms" | "kakao_alimtalk";

export type NotificationEvent =
  | "inquiry_received"        // 의뢰인 — 문의 접수 완료
  | "case_status_changed"     // 의뢰인 — 사건 상태 변경
  | "document_requested"      // 의뢰인 — 자료 요청
  | "case_closed"             // 의뢰인 — 사건 종결
  | "password_reset";         // 의뢰인 — 비밀번호 재설정 링크

export type NotificationPayload = {
  event: NotificationEvent;
  toEmail?: string;
  toPhone?: string;
  toName: string;
  trackingCode?: string;
  variables: Record<string, string>;
};

const TEMPLATES: Record<NotificationEvent, { subject: string; bodyTemplate: string }> = {
  inquiry_received: {
    subject: "[ETHOS] 상담 접수가 완료되었습니다",
    bodyTemplate:
      "{{name}}님, 상담 접수 감사합니다.\n\n" +
      "접수번호: {{trackingCode}}\n" +
      "사실관계와 자료 확인 후 영업일 1일 내 회신드리겠습니다.\n\n" +
      "진행상황 조회: {{trackingUrl}}\n\n" +
      "ETHOS 행정사사무소"
  },
  case_status_changed: {
    subject: "[ETHOS] 사건 상태가 업데이트되었습니다",
    bodyTemplate:
      "{{name}}님, 사건 {{caseNo}} 상태가 '{{newStatus}}'로 업데이트되었습니다.\n\n" +
      "다음 단계: {{nextAction}}\n" +
      "조회: {{trackingUrl}}\n\n" +
      "ETHOS 행정사사무소"
  },
  document_requested: {
    subject: "[ETHOS] 추가 자료 요청 안내",
    bodyTemplate:
      "{{name}}님, 사건 {{caseNo}} 진행을 위해 자료가 필요합니다.\n\n" +
      "요청 자료: {{documentList}}\n" +
      "회신 기한: {{dueDate}}\n\n" +
      "ETHOS 행정사사무소"
  },
  case_closed: {
    subject: "[ETHOS] 사건이 종결되었습니다",
    bodyTemplate:
      "{{name}}님, 사건 {{caseNo}}이 종결되었습니다.\n\n" +
      "결과 요약: {{resultSummary}}\n\n" +
      "감사합니다.\n\n" +
      "ETHOS 행정사사무소"
  },
  password_reset: {
    subject: "[ETHOS] 비밀번호 재설정 안내",
    bodyTemplate:
      "{{name}}님, 비밀번호 재설정 요청을 받았습니다.\n\n" +
      "아래 링크에서 1시간 이내에 새 비밀번호를 설정하세요.\n" +
      "{{resetUrl}}\n\n" +
      "본인이 요청하지 않으셨다면 이 메일을 무시해 주세요.\n\n" +
      "ETHOS 행정사사무소"
  }
};

function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}

export async function sendClientNotification(payload: NotificationPayload): Promise<{ ok: boolean; reason?: string }> {
  const provider = (process.env.NOTIFICATION_PROVIDER ?? "none").toLowerCase();
  const template = TEMPLATES[payload.event];
  if (!template) return { ok: false, reason: "UNKNOWN_EVENT" };

  const subject = renderTemplate(template.subject, payload.variables);
  const body = renderTemplate(template.bodyTemplate, {
    ...payload.variables,
    name: payload.toName,
    trackingCode: payload.trackingCode ?? "",
    trackingUrl: payload.trackingCode
      ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/track?code=${payload.trackingCode}`
      : ""
  });

  if (provider === "none") {
    console.log("[notification:dry-run]", { to: payload.toEmail, subject, body });
    return { ok: true, reason: "DRY_RUN" };
  }

  if (provider === "resend") {
    return sendViaResend({ to: payload.toEmail, subject, body });
  }

  // 추가 provider 연동 시 여기에 분기
  console.warn("[notification] Unknown provider:", provider);
  return { ok: false, reason: "UNKNOWN_PROVIDER" };
}

async function sendViaResend({
  to,
  subject,
  body
}: {
  to?: string;
  subject: string;
  body: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "noreply@ethos.kr";
  if (!apiKey) return { ok: false, reason: "MISSING_RESEND_API_KEY" };
  if (!to) return { ok: false, reason: "MISSING_TO_EMAIL" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: body
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[notification:resend] failed", res.status, text);
      return { ok: false, reason: `RESEND_${res.status}` };
    }

    return { ok: true };
  } catch (error) {
    console.error("[notification:resend] exception", error);
    return { ok: false, reason: "RESEND_EXCEPTION" };
  }
}
