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
  const target = input.channel === "public"
    ? process.env.TELEGRAM_CHANNEL_ID?.trim()
    : process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
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
    `${prefix} *${escapeMd(input.title)}*`,
    ...(input.lines ?? []).map((l) => escapeMd(l)),
    ...(input.url ? [`🔗 ${escapeMd(input.url)}`] : [])
  ];
  const text = lines.join("\n");

  try {
    const res = await fetch(`${API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "MarkdownV2",
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

function escapeMd(s: string): string {
  // Telegram MarkdownV2 reserved chars
  return s.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}
