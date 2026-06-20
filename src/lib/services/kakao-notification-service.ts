import { logger } from "@/lib/utils/logger";
/**
 * KakaoTalk Alimtalk notification service.
 *
 * Sends templated notifications via the Kakao Alimtalk API.
 * Requires KAKAO_REST_API_KEY and KAKAO_SENDER_KEY environment variables.
 * When env vars are missing the helpers log a warning and return false,
 * so calling code can safely invoke them in any environment.
 */

export interface KakaoNotification {
  to: string;
  templateId: string;
  variables: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

export async function sendKakaoAlimtalk(
  notification: KakaoNotification
): Promise<boolean> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  const senderKey = process.env.KAKAO_SENDER_KEY;

  if (!apiKey || !senderKey) {
    logger.warn(
      "[kakao-notification] KAKAO_REST_API_KEY 또는 KAKAO_SENDER_KEY 미설정 — 알림톡 전송을 건너뜁니다."
    );
    return false;
  }

  try {
    const res = await fetch(
      "https://kapi.kakao.com/v2/api/talk/memo/default/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `KakaoAK ${apiKey}`,
        },
        body: JSON.stringify({
          senderKey,
          templateId: notification.templateId,
          recipientList: [
            {
              recipientNo: notification.to,
              templateParameter: notification.variables,
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      logger.error("[kakao-notification] API error", res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    logger.error("[kakao-notification] network error", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export async function notifyInquiryReceived(
  phone: string,
  name: string,
  trackingCode: string
): Promise<boolean> {
  return sendKakaoAlimtalk({
    to: phone,
    templateId: "inquiry_received",
    variables: { name, trackingCode },
  });
}

export async function notifyCaseUpdate(
  phone: string,
  caseTitle: string,
  newStatus: string
): Promise<boolean> {
  return sendKakaoAlimtalk({
    to: phone,
    templateId: "case_status_update",
    variables: { caseTitle, newStatus },
  });
}
