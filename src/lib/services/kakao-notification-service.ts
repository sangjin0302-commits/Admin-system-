import { createHmac, randomBytes } from "crypto";
import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";

/**
 * KakaoTalk Alimtalk (비즈메시지) — Solapi (CoolSMS 후신) adapter.
 *
 * 환경변수
 *   SOLAPI_API_KEY            (필수)
 *   SOLAPI_API_SECRET         (필수)
 *   SOLAPI_PFID               카카오 발신프로필 ID (필수)
 *   SOLAPI_SENDER_PHONE       SMS 폴백용 발신번호 (선택)
 *
 * 미설정 시 모든 헬퍼는 false를 반환하고 경고만 남깁니다 — 호출 측 안전.
 *
 * Solapi API 문서: https://developers.solapi.com
 *   POST https://api.solapi.com/messages/v4/send
 *   인증: HMAC-SHA256 (Authorization 헤더)
 */

export interface KakaoNotification {
  to: string;                          // 수신자 휴대전화번호 (E.164 또는 01012345678)
  templateId: string;                  // 카카오에서 사전 승인된 알림톡 템플릿 ID
  variables: Record<string, string>;   // #{변수명} → 값
  /** SMS 폴백을 비활성화 (기본 활성). */
  disableSmsFallback?: boolean;
}

const SOLAPI_BASE = "https://api.solapi.com";

function getConfig() {
  const apiKey = process.env.SOLAPI_API_KEY?.trim();
  const apiSecret = process.env.SOLAPI_API_SECRET?.trim();
  const pfId = process.env.SOLAPI_PFID?.trim();
  const senderPhone = process.env.SOLAPI_SENDER_PHONE?.trim();
  if (!apiKey || !apiSecret || !pfId) return null;
  return { apiKey, apiSecret, pfId, senderPhone };
}

export function isAlimtalkConnected(): boolean {
  return getConfig() !== null;
}

function buildAuthHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const sig = createHmac("sha256", apiSecret).update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${sig}`;
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/#\{([^}]+)\}/g, (_, k) => vars[k.trim()] ?? "");
}

// ---------------------------------------------------------------------------
// Core send
// ---------------------------------------------------------------------------

export async function sendKakaoAlimtalk(
  notification: KakaoNotification,
  fallbackText?: string
): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) {
    logger.warn(
      "[kakao-notification] SOLAPI_* 환경변수 미설정 — 알림톡 전송을 건너뜁니다."
    );
    return false;
  }

  const message: Record<string, unknown> = {
    to: normalizePhone(notification.to),
    type: "ATA",
    kakaoOptions: {
      pfId: cfg.pfId,
      templateId: notification.templateId,
      variables: notification.variables,
    },
  };

  if (cfg.senderPhone && !notification.disableSmsFallback) {
    message.from = cfg.senderPhone;
    if (fallbackText) {
      (message.kakaoOptions as Record<string, unknown>).disableSms = false;
      message.text = fallbackText;
    }
  }

  try {
    const res = await fetch(`${SOLAPI_BASE}/messages/v4/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(cfg.apiKey, cfg.apiSecret),
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("[kakao-notification] Solapi API error", res.status, body);
      captureError(new Error(`Solapi ${res.status}`), { body });
      return false;
    }
    return true;
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    return false;
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers — 템플릿 ID는 환경 변수로 override 가능 (운영 전 카카오 승인 필요)
// ---------------------------------------------------------------------------

const TEMPLATE_INQUIRY_RECEIVED =
  process.env.SOLAPI_TEMPLATE_INQUIRY_RECEIVED?.trim() || "inquiry_received";
const TEMPLATE_CASE_STATUS_UPDATE =
  process.env.SOLAPI_TEMPLATE_CASE_STATUS?.trim() || "case_status_update";
const TEMPLATE_DEADLINE_REMINDER =
  process.env.SOLAPI_TEMPLATE_DEADLINE?.trim() || "deadline_reminder";
const TEMPLATE_PAYMENT_RECEIVED =
  process.env.SOLAPI_TEMPLATE_PAYMENT?.trim() || "payment_received";

export async function notifyInquiryReceived(
  phone: string,
  name: string,
  trackingCode: string
): Promise<boolean> {
  return sendKakaoAlimtalk(
    {
      to: phone,
      templateId: TEMPLATE_INQUIRY_RECEIVED,
      variables: { 고객명: name, 접수번호: trackingCode },
    },
    renderTemplate(
      "[ETHOS] #{고객명}님 접수 완료 — 접수번호 #{접수번호}",
      { 고객명: name, 접수번호: trackingCode }
    )
  );
}

export async function notifyCaseUpdate(
  phone: string,
  caseTitle: string,
  newStatus: string
): Promise<boolean> {
  return sendKakaoAlimtalk(
    {
      to: phone,
      templateId: TEMPLATE_CASE_STATUS_UPDATE,
      variables: { 사건명: caseTitle, 상태: newStatus },
    },
    renderTemplate(
      "[ETHOS] #{사건명} 상태 변경: #{상태}",
      { 사건명: caseTitle, 상태: newStatus }
    )
  );
}

export async function notifyDeadlineReminder(
  phone: string,
  caseTitle: string,
  deadlineISO: string
): Promise<boolean> {
  return sendKakaoAlimtalk(
    {
      to: phone,
      templateId: TEMPLATE_DEADLINE_REMINDER,
      variables: { 사건명: caseTitle, 기한: deadlineISO },
    },
    renderTemplate(
      "[ETHOS] #{사건명} 기한 알림 — #{기한}",
      { 사건명: caseTitle, 기한: deadlineISO }
    )
  );
}

export async function notifyPaymentReceived(
  phone: string,
  caseTitle: string,
  amount: number
): Promise<boolean> {
  const amt = amount.toLocaleString("ko-KR") + "원";
  return sendKakaoAlimtalk(
    {
      to: phone,
      templateId: TEMPLATE_PAYMENT_RECEIVED,
      variables: { 사건명: caseTitle, 금액: amt },
    },
    renderTemplate(
      "[ETHOS] #{사건명} 입금 확인 — #{금액}",
      { 사건명: caseTitle, 금액: amt }
    )
  );
}
