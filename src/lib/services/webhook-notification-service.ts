import { logger } from "@/lib/utils/logger";
// ---------------------------------------------------------------------------
// Webhook Notification Service — Slack & Telegram
// ---------------------------------------------------------------------------

export interface WebhookEvent {
  type: string;
  title: string;
  message: string;
  url?: string;
  metadata?: Record<string, string>;
}

interface WebhookResult {
  slack: boolean;
  telegram: boolean;
}

// ---- Slack ----------------------------------------------------------------

function buildSlackPayload(event: WebhookEvent) {
  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: { type: "plain_text", text: event.title, emoji: true },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: event.message },
    },
  ];

  if (event.url) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `<${event.url}|자세히 보기>` },
    });
  }

  if (event.metadata && Object.keys(event.metadata).length > 0) {
    const fields = Object.entries(event.metadata).map(([k, v]) => ({
      type: "mrkdwn" as const,
      text: `*${k}:* ${v}`,
    }));
    blocks.push({ type: "section", fields });
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `이벤트 유형: \`${event.type}\` · ${new Date().toISOString()}`,
      },
    ],
  });

  return { blocks };
}

async function sendSlack(event: WebhookEvent): Promise<boolean> {
  const url = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackPayload(event)),
    });
    if (!res.ok) {
      logger.error(`[webhook] Slack responded ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.error("[webhook] Slack send failed:", err);
    return false;
  }
}

// ---- Telegram -------------------------------------------------------------

function buildTelegramHtml(event: WebhookEvent): string {
  const parts: string[] = [
    `<b>${escapeHtml(event.title)}</b>`,
    "",
    escapeHtml(event.message),
  ];

  if (event.url) {
    parts.push("", `<a href="${event.url}">자세히 보기</a>`);
  }

  if (event.metadata && Object.keys(event.metadata).length > 0) {
    parts.push("");
    for (const [k, v] of Object.entries(event.metadata)) {
      parts.push(`<b>${escapeHtml(k)}:</b> ${escapeHtml(v)}`);
    }
  }

  parts.push("", `<code>${event.type}</code> · ${new Date().toISOString()}`);

  return parts.join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendTelegram(event: WebhookEvent): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return false;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: buildTelegramHtml(event),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );
    if (!res.ok) {
      logger.error(`[webhook] Telegram responded ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.error("[webhook] Telegram send failed:", err);
    return false;
  }
}

// ---- Public API -----------------------------------------------------------

export async function sendWebhookNotification(
  event: WebhookEvent,
): Promise<WebhookResult> {
  const [slack, telegram] = await Promise.all([
    sendSlack(event),
    sendTelegram(event),
  ]);
  return { slack, telegram };
}

export function notifyCaseStatusChange(
  caseTitle: string,
  oldStatus: string,
  newStatus: string,
) {
  sendWebhookNotification({
    type: "case.status_changed",
    title: "사건 상태 변경",
    message: `"${caseTitle}" 상태가 변경되었습니다.`,
    metadata: { "이전 상태": oldStatus, "새 상태": newStatus },
  });
}

export function notifyNewInquiry(name: string, inquiryType: string) {
  sendWebhookNotification({
    type: "inquiry.created",
    title: "새 문의 접수",
    message: `${name}님이 새 문의를 접수했습니다.`,
    metadata: { "문의 유형": inquiryType },
  });
}
