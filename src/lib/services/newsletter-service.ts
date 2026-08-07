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
import { sendNewBlogNotification, sendNewsletterWelcome } from "@/lib/services/email-service";
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
const KEY_LAST_POST_NOTIFY = "newsletter.lastPostNotifyAt"; // ISO watermark
const PENDING_TTL_MS = 48 * 60 * 60 * 1000; // 48h
const MAX_POSTS_PER_RUN = 5; // 한 실행에서 알림 보낼 최대 신규 글 수(백로그 폭주 방지)

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

const MAX_CAS_RETRIES = 5;

/**
 * Read-modify-write 를 compare-and-swap 로 원자화 — JSON blob 저장의 lost-update
 * (동시 구독/해지 시 구독자 유실) 방지. 새 마이그레이션 없이 기존 `value` 컬럼으로 낙관적 잠금.
 *
 * 읽은 value 가 그대로일 때만 갱신(updateMany where value=old → count 1). 경쟁으로 값이
 * 바뀌었으면 count 0 → 최신값 다시 읽고 재시도. mutator 는 재실행될 수 있으니 순수해야 하고,
 * 토큰·랜덤값은 반드시 호출부에서 만들어 넘긴다(mutator 안에서 생성 금지).
 */
async function mutateJson<T>(key: string, fallback: T, mutator: (current: T) => T): Promise<T> {
  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    let current: T;
    try {
      current = row?.value ? (JSON.parse(row.value) as T) : fallback;
    } catch {
      current = fallback;
    }
    const next = mutator(current);
    const nextStr = JSON.stringify(next);

    if (!row) {
      // 행 없음 → create. 경쟁으로 이미 생겼으면 unique(key) 충돌 → 재시도(다음 회차 update 경로).
      try {
        await prisma.siteSetting.create({
          data: { key, value: nextStr, updatedBy: "newsletter-service" },
        });
        return next;
      } catch {
        continue;
      }
    }

    // 행 있음 → 읽은 value 그대로일 때만 갱신(CAS). 아니면 경쟁 발생 → 재시도.
    const res = await prisma.siteSetting.updateMany({
      where: { key, value: row.value },
      data: { value: nextStr, updatedBy: "newsletter-service" },
    });
    if (res.count === 1) return next;
  }
  throw new Error(`[newsletter] mutateJson CAS 재시도 초과(${key}) — 동시쓰기 과다`);
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

  // 토큰·시각은 mutator 밖에서 생성(재시도 시 불변 보장).
  const token = randomUUID().replace(/-/g, "");
  const createdAt = new Date().toISOString();
  const cats = categories && categories.length > 0 ? categories : undefined;

  await mutateJson<PendingConfirmation[]>(KEY_PENDING, [], (pending) => {
    const now = Date.now();
    const cleaned = pending.filter(
      (p) => now - new Date(p.createdAt).getTime() < PENDING_TTL_MS && p.email !== email
    );
    cleaned.push({ email, token, createdAt, categories: cats });
    return cleaned;
  });
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

  // 토큰 제거는 원자적으로(다른 요청의 pending 변경을 덮어쓰지 않게).
  await mutateJson<PendingConfirmation[]>(KEY_PENDING, [], (list) =>
    list.filter((p) => p.token !== token)
  );

  const subscribedAt = new Date().toISOString();
  let added = false;
  await mutateJson<Subscriber[]>(KEY_SUBSCRIBERS, [], (confirmed) => {
    if (confirmed.some((s) => s.email === match.email)) {
      added = false; // 이미 확인된 구독자의 재확인 → 그대로.
      return confirmed;
    }
    added = true;
    return [...confirmed, { email: match.email, subscribedAt, categories: match.categories }];
  });

  // 최초 확인 시에만 1회 환영 메일(중복 방지, best-effort — 실패해도 확인 플로우는 계속).
  if (added) {
    try {
      await sendNewsletterWelcome({ to: match.email });
    } catch (err) {
      logger.warn("[newsletter] welcome email failed", err);
    }
  }

  return { ok: true, email: match.email };
}

export async function unsubscribe(emailRaw: string): Promise<{ ok: boolean }> {
  const email = normalizeEmail(emailRaw);
  let removed = false;
  await mutateJson<Subscriber[]>(KEY_SUBSCRIBERS, [], (confirmed) => {
    const next = confirmed.filter((s) => s.email !== email);
    removed = next.length !== confirmed.length;
    return next;
  });
  return { ok: removed };
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

/**
 * 새로 발행된 블로그 글을 확인된 구독자에게 개별 알림 발송.
 * (주간 digest 와 별개 — 발행 즉시 알림. RSS·수동발행 모두 커버.)
 *
 * - watermark(마지막 알림 시각) 이후 published 된 글만 대상 → 중복 발송 방지.
 * - 구독자별 개별 발송(to 배열에 한 명씩) → 수신자 간 이메일 노출 없음.
 * - sendEmail 의 무료한도 가드에 걸리면 발송이 실패로 돌아오므로 즉시 중단.
 * - watermark 는 "모든 구독자에게 발송을 마친 마지막 글"까지만 전진 → 한도로 중간 중단되면
 *   미발송(또는 부분발송) 글은 다음 실행에서 재시도되어 놓치지 않음.
 */
export async function notifyNewlyPublishedPosts(
  limit = MAX_POSTS_PER_RUN
): Promise<{ ok: boolean; posts: number; emails: number; stopped?: string }> {
  const subscribers = await listSubscribers();
  if (subscribers.length === 0) return { ok: true, posts: 0, emails: 0 };

  const watermarkIso = await readJson<string>(KEY_LAST_POST_NOTIFY, "");
  const since = watermarkIso
    ? new Date(watermarkIso)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 최초 실행: 최근 7일치만

  const posts = await prisma.blogPost.findMany({
    where: { published: true, publishedAt: { gt: since } },
    orderBy: { publishedAt: "asc" },
    take: limit,
    select: { title: true, slug: true, excerpt: true, publishedAt: true }
  });
  if (posts.length === 0) return { ok: true, posts: 0, emails: 0 };

  let emails = 0;
  let stopped: string | undefined;
  // 완전히(모든 구독자) 발송을 마친 마지막 글의 발행시각 — watermark 는 여기까지만 전진.
  // (중단 시 미발송 글이 통째로 건너뛰어지는 것을 방지 — 부분발송 글은 다음 실행에서 재시도)
  let lastFullyDoneAt: Date | null = null;

  outer: for (const post of posts) {
    for (const sub of subscribers) {
      const res = await sendNewBlogNotification({
        to: [sub.email],
        postTitle: post.title,
        postSlug: post.slug,
        postDescription: post.excerpt || undefined
      });
      if (res.ok) {
        emails++;
      } else {
        // 미설정/한도초과 등 시스템적 실패 → 더 보내지 말고 중단
        stopped = "send_failed_or_quota";
        break outer;
      }
    }
    // 이 글은 모든 구독자에게 발송 완료.
    if (post.publishedAt) lastFullyDoneAt = post.publishedAt;
  }

  // watermark 는 "완전히 발송 끝난 마지막 글"까지만 전진. 하나도 못 끝냈으면 유지(다음에 재시도).
  if (lastFullyDoneAt) {
    await writeJson(KEY_LAST_POST_NOTIFY, lastFullyDoneAt.toISOString());
  }

  logger.info("[newsletter] notifyNewlyPublishedPosts", {
    posts: posts.length,
    subscribers: subscribers.length,
    emails,
    stopped
  });
  return { ok: true, posts: posts.length, emails, stopped };
}
