/**
 * 통합 알림 오케스트레이터 — 알림톡 우선, 실패 시 이메일 폴백.
 *
 * 사용 예:
 *   await notifyClient({
 *     phone: party.phone,
 *     email: party.email,
 *     templateId: "case_status_update",
 *     variables: { 사건명: t, 상태: s },
 *     fallbackText: "[ETHOS] 사건 상태 변경",
 *     emailSubject: "[ETHOS] 사건 진행 안내",
 *     emailHtml: "<p>...</p>",
 *     caseId,
 *   });
 *
 * 동작:
 *   1) phone 있고 SOLAPI 설정됨 → sendKakaoAlimtalk
 *      - 성공: return {channel: "alimtalk", ok: true}
 *      - 실패/스킵: 폴백 진행
 *   2) email 있고 RESEND_API_KEY 설정됨 → Resend 이메일
 *      - 성공/실패 모두 NotificationLog에 영속 (sendKakaoAlimtalk가 이미 기록)
 *      - 이메일 결과도 별도 NotificationLog (channel=EMAIL)
 *
 * Solapi/Resend 둘 다 없으면 SKIPPED만 남기고 false.
 */

import { logger } from "@/lib/utils/logger";
import { captureError } from "@/lib/services/error-monitor-service";
import { prisma } from "@/lib/prisma/client";
import { sendKakaoAlimtalk } from "@/lib/services/kakao-notification-service";

export interface NotifyClientOptions {
  phone?: string | null;
  email?: string | null;
  templateId: string;
  variables: Record<string, string>;
  fallbackText: string;
  emailSubject?: string;
  emailHtml?: string;
  caseId?: string;
}

export interface NotifyResult {
  ok: boolean;
  channel: "alimtalk" | "email" | "none";
  detail?: string;
}

function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY?.trim();
}

async function logEmail(
  recipient: string,
  subject: string,
  body: string,
  status: "SENT" | "FAILED" | "SKIPPED",
  caseId?: string,
  errorMessage?: string,
  providerId?: string
): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        channel: "EMAIL",
        templateId: subject.slice(0, 80),
        recipient,
        caseId,
        subject,
        body: body.slice(0, 4000),
        status,
        errorMessage,
        providerId,
        sentAt: status === "SENT" ? new Date() : undefined,
      },
    });
  } catch {
    // best-effort
  }
}

async function sendResendEmail(
  to: string,
  subject: string,
  html: string,
  caseId?: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || "noreply@ethos.kr";
  if (!apiKey) {
    await logEmail(to, subject, html, "SKIPPED", caseId, "RESEND_API_KEY 미설정");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.error("[notify-orchestrator] Resend error", res.status, body);
      captureError(new Error(`Resend ${res.status}`), { body });
      await logEmail(
        to,
        subject,
        html,
        "FAILED",
        caseId,
        `${res.status}: ${body.slice(0, 200)}`
      );
      return false;
    }
    const data = await res.json().catch(() => ({} as Record<string, unknown>));
    const providerId = (data as { id?: string }).id;
    await logEmail(to, subject, html, "SENT", caseId, undefined, providerId);
    return true;
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)));
    await logEmail(
      to,
      subject,
      html,
      "FAILED",
      caseId,
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}

export async function notifyClient(opts: NotifyClientOptions): Promise<NotifyResult> {
  // 1차: 알림톡 (phone 있을 때)
  if (opts.phone) {
    const ok = await sendKakaoAlimtalk(
      {
        to: opts.phone,
        templateId: opts.templateId,
        variables: opts.variables,
        caseId: opts.caseId,
      },
      opts.fallbackText
    );
    if (ok) return { ok: true, channel: "alimtalk" };
    logger.warn(
      "[notify-orchestrator] alimtalk failed/skipped — trying email fallback"
    );
  }

  // 2차: 이메일 폴백 (email 있고 Resend 설정됨)
  if (opts.email && isResendConfigured()) {
    const subject = opts.emailSubject ?? opts.fallbackText.slice(0, 80);
    const html =
      opts.emailHtml ??
      `<div style="font-family: sans-serif"><p>${opts.fallbackText}</p></div>`;
    const ok = await sendResendEmail(opts.email, subject, html, opts.caseId);
    if (ok) return { ok: true, channel: "email" };
    return { ok: false, channel: "email", detail: "send failed" };
  }

  return { ok: false, channel: "none", detail: "no available channel" };
}
