/**
 * 커뮤니티 Q&A 포럼 서비스 (SEO 지향).
 *
 * 저장: SiteSetting key = "community.questions", value = JSON.stringify(Question[])
 * 마이그레이션 없이 SiteSetting JSON에 리스트 저장.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const SITE_SETTING_KEY = "community.questions";

export type QuestionStatus = "PENDING" | "ANSWERED" | "SPAM";

export type CommunityQuestion = {
  id: string;
  title: string;
  body: string;
  category: string;
  askerName?: string;
  askedAt: string; // ISO
  status: QuestionStatus;
  answer?: string;
  answeredAt?: string;
  answeredBy?: string;
  viewCount?: number;
};

export const COMMUNITY_CATEGORIES = [
  "비자·체류",
  "행정심판",
  "계약·사실조사",
  "인허가",
  "법인·기타",
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

function makeId() {
  return `q_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function readAll(): Promise<CommunityQuestion[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SITE_SETTING_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValid);
  } catch (err) {
    logger.warn("[community] read failed", err);
    return [];
  }
}

function isValid(x: unknown): x is CommunityQuestion {
  if (!x || typeof x !== "object") return false;
  const q = x as Record<string, unknown>;
  return (
    typeof q.id === "string" &&
    typeof q.title === "string" &&
    typeof q.body === "string" &&
    typeof q.category === "string" &&
    typeof q.askedAt === "string" &&
    (q.status === "PENDING" || q.status === "ANSWERED" || q.status === "SPAM")
  );
}

async function writeAll(items: CommunityQuestion[]): Promise<void> {
  const value = JSON.stringify(items);
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTING_KEY },
    create: { key: SITE_SETTING_KEY, value },
    update: { value },
  });
}

export type AskInput = {
  title: string;
  body: string;
  category: string;
  askerName?: string;
};

export async function askQuestion(input: AskInput): Promise<CommunityQuestion> {
  const q: CommunityQuestion = {
    id: makeId(),
    title: input.title.trim().slice(0, 200),
    body: input.body.trim().slice(0, 5000),
    category: input.category.trim().slice(0, 60) || "기타",
    askerName: input.askerName?.trim().slice(0, 40) || undefined,
    askedAt: new Date().toISOString(),
    status: "PENDING",
    viewCount: 0,
  };
  const items = await readAll();
  items.push(q);
  // Cap 1000 entries.
  const trimmed = items.slice(-1000);
  await writeAll(trimmed);
  return q;
}

export type ListOptions = {
  page?: number;
  perPage?: number;
  category?: string;
  status?: QuestionStatus;
  search?: string;
  publicOnly?: boolean; // include only ANSWERED for public forum listing
};

export async function listQuestions(opts: ListOptions = {}): Promise<{
  items: CommunityQuestion[];
  total: number;
  page: number;
  perPage: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.max(1, Math.min(100, opts.perPage ?? 20));
  let items = await readAll();

  if (opts.publicOnly) items = items.filter((q) => q.status === "ANSWERED");
  if (opts.status) items = items.filter((q) => q.status === opts.status);
  if (opts.category) items = items.filter((q) => q.category === opts.category);
  if (opts.search) {
    const s = opts.search.toLowerCase();
    items = items.filter(
      (q) => q.title.toLowerCase().includes(s) || q.body.toLowerCase().includes(s),
    );
  }

  items.sort((a, b) => (a.askedAt < b.askedAt ? 1 : -1));
  const total = items.length;
  const start = (page - 1) * perPage;
  return { items: items.slice(start, start + perPage), total, page, perPage };
}

export async function getQuestion(id: string): Promise<CommunityQuestion | null> {
  const items = await readAll();
  return items.find((q) => q.id === id) ?? null;
}

/** Fire-and-forget view count increment (best-effort). */
export async function incrementView(id: string): Promise<void> {
  try {
    const items = await readAll();
    const idx = items.findIndex((q) => q.id === id);
    if (idx < 0) return;
    items[idx] = { ...items[idx], viewCount: (items[idx].viewCount ?? 0) + 1 };
    await writeAll(items);
  } catch (err) {
    logger.warn("[community] view increment failed", err);
  }
}

export type AnswerInput = {
  id: string;
  answer: string;
  answeredBy?: string;
};

export async function answerQuestion(input: AnswerInput): Promise<CommunityQuestion | null> {
  const items = await readAll();
  const idx = items.findIndex((q) => q.id === input.id);
  if (idx < 0) return null;
  items[idx] = {
    ...items[idx],
    answer: input.answer.trim().slice(0, 20000),
    answeredAt: new Date().toISOString(),
    answeredBy: input.answeredBy,
    status: "ANSWERED",
  };
  await writeAll(items);
  return items[idx];
}

export async function moderateQuestion(
  id: string,
  status: QuestionStatus,
): Promise<CommunityQuestion | null> {
  const items = await readAll();
  const idx = items.findIndex((q) => q.id === id);
  if (idx < 0) return null;
  items[idx] = { ...items[idx], status };
  await writeAll(items);
  return items[idx];
}

export function isValidStatus(v: unknown): v is QuestionStatus {
  return v === "PENDING" || v === "ANSWERED" || v === "SPAM";
}
