/**
 * Slack/Discord 이중 채널 알림 서비스.
 *
 * env:
 *   SLACK_WEBHOOK_URL   Slack 인커밍 웹훅
 *   DISCORD_WEBHOOK_URL Discord 채널 웹훅
 *
 * 이벤트 종류: new_inquiry, deadline_warning, high_priority, payment_received
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type TeamEvent = "new_inquiry" | "deadline_warning" | "high_priority" | "payment_received";

export type TeamNotificationPayload = {
  title: string;
  summary?: string;
  url?: string;
  fields?: { label: string; value: string }[];
};

export type TeamNotificationConfig = {
  slack: boolean;
  discord: boolean;
  events: Record<TeamEvent, boolean>;
};

const CONFIG_KEY = "team_notifications.config";

const DEFAULT_CONFIG: TeamNotificationConfig = {
  slack: true,
  discord: true,
  events: {
    new_inquiry: true,
    deadline_warning: true,
    high_priority: true,
    payment_received: true
  }
};

export async function getTeamNotificationConfig(): Promise<TeamNotificationConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: CONFIG_KEY } });
    if (!row?.value) return DEFAULT_CONFIG;
    const parsed = JSON.parse(row.value);
    return {
      slack: typeof parsed.slack === "boolean" ? parsed.slack : DEFAULT_CONFIG.slack,
      discord: typeof parsed.discord === "boolean" ? parsed.discord : DEFAULT_CONFIG.discord,
      events: { ...DEFAULT_CONFIG.events, ...(parsed.events ?? {}) }
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveTeamNotificationConfig(cfg: TeamNotificationConfig): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(cfg) },
    update: { value: JSON.stringify(cfg) }
  });
}

function buildSlackBlocks(event: TeamEvent, payload: TeamNotificationPayload) {
  const fields = (payload.fields ?? []).map((f) => ({
    type: "mrkdwn" as const,
    text: `*${f.label}*\n${f.value}`
  }));
  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `[${event}] ${payload.title}` }
    }
  ];
  if (payload.summary) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: payload.summary } });
  }
  if (fields.length > 0) {
    blocks.push({ type: "section", fields });
  }
  if (payload.url) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `<${payload.url}|열기>` }
    });
  }
  return blocks;
}

function buildDiscordEmbed(event: TeamEvent, payload: TeamNotificationPayload) {
  return {
    embeds: [
      {
        title: `[${event}] ${payload.title}`,
        description: payload.summary ?? "",
        url: payload.url,
        fields: (payload.fields ?? []).map((f) => ({ name: f.label, value: f.value, inline: true }))
      }
    ]
  };
}

async function postJson(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return res.ok;
  } catch (err) {
    logger.warn("[team-notify] post failed", err);
    return false;
  }
}

export async function sendTeamNotification(
  event: TeamEvent,
  payload: TeamNotificationPayload
): Promise<{ slack: boolean; discord: boolean }> {
  const cfg = await getTeamNotificationConfig();
  if (!cfg.events[event]) return { slack: false, discord: false };

  const slackUrl = process.env.SLACK_WEBHOOK_URL?.trim();
  const discordUrl = process.env.DISCORD_WEBHOOK_URL?.trim();

  const slackPromise =
    cfg.slack && slackUrl
      ? postJson(slackUrl, { text: `[${event}] ${payload.title}`, blocks: buildSlackBlocks(event, payload) })
      : Promise.resolve(false);
  const discordPromise = cfg.discord && discordUrl ? postJson(discordUrl, buildDiscordEmbed(event, payload)) : Promise.resolve(false);

  const [slack, discord] = await Promise.all([slackPromise, discordPromise]);
  return { slack, discord };
}
