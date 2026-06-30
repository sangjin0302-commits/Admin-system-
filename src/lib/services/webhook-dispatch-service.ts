import { logger } from "@/lib/utils/logger";

export type WebhookEvent =
  | "inquiry.created"
  | "inquiry.status_changed"
  | "case.created"
  | "case.updated"
  | "payment.confirmed"
  | "document.signed";

interface WebhookPayload {
  event: WebhookEvent;
  data: Record<string, unknown>;
  timestamp: string;
}

// In-memory webhook endpoints (configurable via site settings in future)
const WEBHOOK_ENDPOINTS: Array<{ url: string; events: WebhookEvent[]; secret?: string }> = [];

export function registerWebhook(url: string, events: WebhookEvent[], secret?: string) {
  WEBHOOK_ENDPOINTS.push({ url, events, secret });
}

export function getRegisteredWebhooks() {
  return WEBHOOK_ENDPOINTS.map(({ url, events }) => ({ url, events }));
}

export async function dispatchWebhook(event: WebhookEvent, data: Record<string, unknown>) {
  const payload: WebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  // Always dispatch to Slack if configured
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    const slackPayload = {
      text: `[${event}] ${JSON.stringify(data).slice(0, 200)}`,
    };
    fetch(slackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    }).catch(err => logger.warn("[webhook] slack failed", err));
  }

  // Dispatch to registered endpoints
  const targets = WEBHOOK_ENDPOINTS.filter(ep => ep.events.includes(event));
  for (const target of targets) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (target.secret) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw", encoder.encode(target.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(JSON.stringify(payload)));
        headers["X-Webhook-Signature"] = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
      }

      fetch(target.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }).catch(err => logger.warn("[webhook] dispatch failed", { url: target.url, err }));
    } catch (err) {
      logger.warn("[webhook] error", { url: target.url, err });
    }
  }
}
