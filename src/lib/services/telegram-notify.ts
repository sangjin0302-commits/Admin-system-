/**
 * 텔레그램 봇 알림 (관리자용).
 *
 * 설정:
 *   TELEGRAM_BOT_TOKEN: BotFather에서 발급
 *   TELEGRAM_ADMIN_CHAT_ID: Jean의 chat_id (개인 또는 그룹)
 *
 * 환경변수 미설정 시 no-op (에러 발생 안 함).
 */

import { logger } from "@/lib/utils/logger";

const API_BASE = "https://api.telegram.org/bot";

export type TelegramAlertKind = "inquiry" | "blog_sync_failed" | "system" | "test";

export interface TelegramAlertInput {
  kind: TelegramAlertKind;
  title: string;
  lines?: string[];
  url?: string;
}

export async function sendTelegramAlert(input: TelegramAlertInput & { channel?: "admin" | "public" }): Promise<{ ok: boolean; reason?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  // 관리자 chat id는 두 변수명 모두 허용 (문서·과거 설정 혼용 방지):
  // TELEGRAM_ADMIN_CHAT_ID(정식) 우선, 없으면 TELEGRAM_CHAT_ID 폴백.
  const adminChatId =
    process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim();
  const target = input.channel === "public"
    ? process.env.TELEGRAM_CHANNEL_ID?.trim()
    : adminChatId;
  if (!token || !target) {
    return { ok: false, reason: "not_configured" };
  }
  const chatId = target;

  const prefix =
    input.kind === "inquiry" ? "📩"
    : input.kind === "blog_sync_failed" ? "⚠️"
    : input.kind === "test" ? "🧪"
    : "🔔";

  const lines = [
    `${prefix} <b>${escapeHtml(input.title)}</b>`,
    ...(input.lines ?? []).map((l) => escapeHtml(l)),
    ...(input.url ? [`🔗 ${escapeHtml(input.url)}`] : [])
  ];
  const text = lines.join("\n");

  try {
    const res = await fetch(`${API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.warn("[telegram] send failed", res.status, body);
      return { ok: false, reason: `http_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    logger.warn("[telegram] exception", err);
    return { ok: false, reason: "exception" };
  }
}

/**
 * Telegram HTML 모드 이스케이프.
 *
 * MarkdownV2는 `_*[]()~`>#+-=|{}.!` 를 전부 이스케이프해야 해서 이메일·URL·날짜가
 * 역슬래시 범벅이 되거나 파싱 실패로 발송 자체가 깨졌다. HTML 모드는 3글자만
 * 처리하면 되므로 한글 본문·링크가 원문 그대로 표시된다.
 */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
