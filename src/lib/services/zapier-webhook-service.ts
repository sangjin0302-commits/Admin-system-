/**
 * Zapier/Make.com 노코드 자동화 웹훅.
 *
 * SiteSetting keys:
 *   - "integration.zapier.subscriptions" — WebhookSubscription[]
 *   - "integration.zapier.history"       — 발송 로그 (최대 200건)
 *
 * 이벤트 종류:
 *   new_inquiry, case_status_changed, payment_received, deadline_soon, case_closed
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const SUBS_KEY = "integration.zapier.subscriptions";
const HISTORY_KEY = "integration.zapier.history";
const MAX_HISTORY = 200;

export const ZAPIER_EVENTS = [
  "new_inquiry",
  "case_status_changed",
  "payment_received",
  "deadline_soon",
  "case_closed",
] as const;
export type ZapierEvent = (typeof ZAPIER_EVENTS)[number];

export type WebhookSubscription = {
  id: string;
  url: string;
  events: ZapierEvent[];
  secret: string;
  active: boolean;
  createdAt: string;
};

export type ZapierLogEntry = {
  ts: string;
  subscriptionId: string;
  event: ZapierEvent;
  ok: boolean;
  status?: number;
  error?: string;
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch (err) {
    logger.warn(`[zapier] siteSetting 파싱 실패 (${key})`, err);
    return fallback;
  }
}

async function writeJson(key: string, v: unknown): Promise<void> {
  const s = JSON.stringify(v);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: s },
    update: { value: s },
  });
}

export async function listSubscriptions(): Promise<WebhookSubscription[]> {
  return readJson<WebhookSubscription[]>(SUBS_KEY, []);
}

export async function upsertSubscription(sub: Omit<WebhookSubscription, "createdAt"> & { createdAt?: string }): Promise<WebhookSubscription> {
  const list = await listSubscriptions();
  const idx = list.findIndex((s) => s.id === sub.id);
  const record: WebhookSubscription = {
    id: sub.id,
    url: sub.url,
    events: sub.events,
    secret: sub.secret,
    active: sub.active,
    createdAt: sub.createdAt ?? new Date().toISOString(),
  };
  if (idx >= 0) list[idx] = record;
  else list.push(record);
  await writeJson(SUBS_KEY, list);
  return record;
}

export async function deleteSubscription(id: string): Promise<void> {
  const list = await listSubscriptions();
  await writeJson(SUBS_KEY, list.filter((s) => s.id !== id));
}

export async function getZapierHistory(): Promise<ZapierLogEntry[]> {
  return readJson<ZapierLogEntry[]>(HISTORY_KEY, []);
}

async function appendHistory(entry: ZapierLogEntry): Promise<void> {
  const list = await getZapierHistory();
  list.unshift(entry);
  await writeJson(HISTORY_KEY, list.slice(0, MAX_HISTORY));
}

async function postWebhook(sub: WebhookSubscription, event: ZapierEvent, payload: unknown): Promise<ZapierLogEntry> {
  const ts = new Date().toISOString();
  try {
    const body = JSON.stringify({ event, at: ts, payload });
    const res = await fetch(sub.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": sub.secret,
        "X-Webhook-Event": event,
      },
      body,
    });
    const entry: ZapierLogEntry = {
      ts,
      subscriptionId: sub.id,
      event,
      ok: res.ok,
      status: res.status,
    };
    if (!res.ok) entry.error = `HTTP ${res.status}`;
    return entry;
  } catch (err) {
    return {
      ts,
      subscriptionId: sub.id,
      event,
      ok: false,
      error: String(err),
    };
  }
}

/** 이벤트를 활성 구독 전체에 POST. best-effort. */
export async function notifyEvent(event: ZapierEvent, payload: unknown): Promise<{ sent: number; failed: number }> {
  if (!(await isFeatureEnabled("zapier_webhooks"))) return { sent: 0, failed: 0 };
  const subs = (await listSubscriptions()).filter((s) => s.active && s.events.includes(event));
  if (subs.length === 0) return { sent: 0, failed: 0 };
  const results = await Promise.all(subs.map((s) => postWebhook(s, event, payload)));
  for (const r of results) await appendHistory(r);
  const sent = results.filter((r) => r.ok).length;
  return { sent, failed: results.length - sent };
}

/** 테스트 발송 — 하나의 구독에 임의 페이로드. */
export async function testSubscription(id: string, payload?: unknown): Promise<ZapierLogEntry | null> {
  const subs = await listSubscriptions();
  const sub = subs.find((s) => s.id === id);
  if (!sub) return null;
  const result = await postWebhook(sub, "new_inquiry", payload ?? { test: true, at: new Date().toISOString() });
  await appendHistory(result);
  return result;
}

/** best-effort 백그라운드 훅. */
export function fireAndForgetNotify(event: ZapierEvent, payload: unknown): void {
  notifyEvent(event, payload).catch((err) => logger.warn("[zapier] bg notifyEvent 실패", err));
}
