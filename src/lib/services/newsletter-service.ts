/**
 * Newsletter subscription service.
 *
 * SiteSetting JSON storage (no new prisma migration).
 * Keys:
 *   - "newsletter.subscribers": Subscriber[] (confirmed only)
 *   - "newsletter.pending": PendingConfirmation[] (awaiting double opt-in)
 */

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type Subscriber = {
  email: string;
  subscribedAt: string;       // ISO
  categories?: string[];
};

export type PendingConfirmation = {
  email: string;
  token: string;
  createdAt: string;          // ISO
  categories?: string[];
};

const KEY_SUBSCRIBERS = "newsletter.subscribers";
const KEY_PENDING = "newsletter.pending";
const PENDING_TTL_MS = 48 * 60 * 60 * 1000; // 48h

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch (err) {
    logger.warn(`[newsletter] read ${key} failed`, err);
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const str = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: str, updatedBy: "newsletter-service" },
    update: { value: str, updatedBy: "newsletter-service" },
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Start subscription — creates a pending record with a confirmation token.
 * Returns the token so the caller can email it.
 */
export async function beginSubscribe(
  emailRaw: string,
  categories?: string[]
): Promise<{ ok: true; token: string; alreadyConfirmed: boolean } | { ok: false; error: string }> {
  const email = normalizeEmail(emailRaw);
  if (!isValidEmail(email)) return { ok: false, error: "INVALID_EMAIL" };

  const confirmed = await readJson<Subscriber[]>(KEY_SUBSCRIBERS, []);
  if (confirmed.some((s) => s.email === email)) {
    return { ok: true, token: "", alreadyConfirmed: true };
  }

  const pending = await readJson<PendingConfirmation[]>(KEY_PENDING, []);
  const now = Date.now();
  const cleaned = pending.filter(
    (p) => now - new Date(p.createdAt).getTime() < PENDING_TTL_MS && p.email !== email
  );

  const token = randomUUID().replace(/-/g, "");
  cleaned.push({
    email,
    token,
    createdAt: new Date().toISOString(),
    categories: categories && categories.length > 0 ? categories : undefined,
  });

  await writeJson(KEY_PENDING, cleaned);
  return { ok: true, token, alreadyConfirmed: false };
}

/**
 * Confirm subscription via token from confirmation email.
 */
export async function confirmSubscribe(
  token: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  if (!token || typeof token !== "string") return { ok: false, error: "INVALID_TOKEN" };

  const pending = await readJson<PendingConfirmation[]>(KEY_PENDING, []);
  const now = Date.now();
  const match = pending.find(
    (p) => p.token === token && now - new Date(p.createdAt).getTime() < PENDING_TTL_MS
  );
  if (!match) return { ok: false, error: "TOKEN_NOT_FOUND_OR_EXPIRED" };

  const remainingPending = pending.filter((p) => p.token !== token);
  await writeJson(KEY_PENDING, remainingPending);

  const confirmed = await readJson<Subscriber[]>(KEY_SUBSCRIBERS, []);
  if (confirmed.some((s) => s.email === match.email)) {
    return { ok: true, email: match.email };
  }
  confirmed.push({
    email: match.email,
    subscribedAt: new Date().toISOString(),
    categories: match.categories,
  });
  await writeJson(KEY_SUBSCRIBERS, confirmed);
  return { ok: true, email: match.email };
}

export async function unsubscribe(emailRaw: string): Promise<{ ok: boolean }> {
  const email = normalizeEmail(emailRaw);
  const confirmed = await readJson<Subscriber[]>(KEY_SUBSCRIBERS, []);
  const next = confirmed.filter((s) => s.email !== email);
  if (next.length === confirmed.length) return { ok: false };
  await writeJson(KEY_SUBSCRIBERS, next);
  return { ok: true };
}

export async function listSubscribers(): Promise<Subscriber[]> {
  return readJson<Subscriber[]>(KEY_SUBSCRIBERS, []);
}

export async function listPending(): Promise<PendingConfirmation[]> {
  return readJson<PendingConfirmation[]>(KEY_PENDING, []);
}

/**
 * Alias matching spec: `subscribe(email, categories?)` — kicks off double opt-in.
 */
export async function subscribe(email: string, categories?: string[]) {
  return beginSubscribe(email, categories);
}
