/**
 * 네이버 지식iN 자동 답변 서비스.
 *
 * 흐름:
 * 1) RSS-like 스크래퍼로 등록 카테고리에서 신규 질문 수집 (RSS/피드 URL은 SiteSetting 저장)
 * 2) Claude Haiku 로 행정업무 관련성 판단 (0~1 confidence)
 * 3) 임계치 이상이면 disclaimer 포함 답변 초안 생성
 * 4) 관리자 승인 큐(SiteSetting)에 저장
 * 5) 실제 게시는 수동 복사 흐름 (지식iN 파트너 API는 TODO)
 *
 * 저장:
 *  - SiteSetting.naver_kin.feeds        : JSON string[] (구독 카테고리 RSS URL 목록)
 *  - SiteSetting.naver_kin.queue        : JSON KinQueueItem[]  (승인 대기/편집/승인/게시 상태)
 *  - SiteSetting.naver_kin.seen         : JSON string[]        (중복 스캔 방지 questionId)
 *
 * TODO(NAVER API): 지식iN 파트너 API 등록 완료 시 postToNaver 훅 연결.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const KEY_FEEDS = "naver_kin.feeds";
const KEY_QUEUE = "naver_kin.queue";
const KEY_SEEN = "naver_kin.seen";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const RELEVANCE_THRESHOLD = 0.6;
const DISCLAIMER =
  "\n\n※ 본 답변은 일반적인 정보 안내이며, 개별 사건은 사실관계에 따라 결론이 달라질 수 있습니다. 정확한 상담은 행정사·변호사와 진행하시기 바랍니다.";

export type KinQueueStatus = "PENDING" | "APPROVED" | "EDITED" | "COPIED" | "REJECTED";

export type KinQueueItem = {
  id: string;
  questionId: string;
  category: string;
  sourceUrl: string;
  title: string;
  body: string;
  confidence: number;
  draft: string;
  status: KinQueueStatus;
  createdAt: string;
  updatedAt: string;
};

type FetchedQuestion = {
  id: string;
  title: string;
  body: string;
  category: string;
  url: string;
};

async function readJsonSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row?.value) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonSetting(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
  });
}

export async function getFeeds(): Promise<string[]> {
  return readJsonSetting<string[]>(KEY_FEEDS, []);
}

export async function setFeeds(feeds: string[]): Promise<void> {
  await writeJsonSetting(KEY_FEEDS, feeds);
}

export async function getQueue(): Promise<KinQueueItem[]> {
  return readJsonSetting<KinQueueItem[]>(KEY_QUEUE, []);
}

async function saveQueue(items: KinQueueItem[]): Promise<void> {
  // 최근 200개만 유지
  await writeJsonSetting(KEY_QUEUE, items.slice(0, 200));
}

async function getSeen(): Promise<Set<string>> {
  const arr = await readJsonSetting<string[]>(KEY_SEEN, []);
  return new Set(arr);
}

async function saveSeen(seen: Set<string>): Promise<void> {
  // 최근 500개만 유지
  const arr = Array.from(seen).slice(-500);
  await writeJsonSetting(KEY_SEEN, arr);
}

/** 매우 단순한 RSS/Atom 파서. 관리자가 등록한 임의의 카테고리 피드에서 신규 항목만 뽑는다. */
async function fetchFeed(url: string): Promise<FetchedQuestion[]> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "ETHOS-kin-bot/1.0" } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: FetchedQuestion[] = [];
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    const matches = xml.match(itemRegex) ?? [];
    for (const raw of matches.slice(0, 30)) {
      const title = raw.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() ?? "";
      const link = raw.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? "";
      const desc =
        raw.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() ?? "";
      if (!title || !link) continue;
      // 지식iN URL 패턴: .../qna/detail.naver?dirId=...&docId=xxxx
      const docId = link.match(/docId=(\d+)/)?.[1] ?? link;
      items.push({
        id: docId,
        title: stripHtml(title),
        body: stripHtml(desc),
        category: url,
        url: link,
      });
    }
    return items;
  } catch (err) {
    logger.warn("[naver-kin] feed fetch 실패", { url, err });
    return [];
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function classifyAndDraft(
  q: FetchedQuestion,
): Promise<{ confidence: number; draft: string } | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;

  const system =
    "You are an assistant for a Korean 행정사 (administrative agent) firm. Given a 네이버 지식iN question, decide relevance to administrative law (행정심판/외국인 체류/영업허가/이의신청/등) and, if relevant, draft a concise, helpful answer in Korean. Output STRICT JSON only, no code fences: {\"confidence\": 0.0-1.0, \"answer\": \"...\"}. answer must be 200-500 chars, plain Korean, no marketing pitch, no phone numbers.";
  const user = `제목: ${q.title}\n내용: ${q.body.slice(0, 1500)}`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 800,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      logger.warn("[naver-kin] anthropic error", res.status);
      return null;
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { confidence?: number; answer?: string };
    const conf = typeof parsed.confidence === "number" ? parsed.confidence : 0;
    const answer = typeof parsed.answer === "string" ? parsed.answer.trim() : "";
    if (!answer) return { confidence: conf, draft: "" };
    return { confidence: conf, draft: answer + DISCLAIMER };
  } catch (err) {
    logger.warn("[naver-kin] classify 예외", err);
    return null;
  }
}

/** 등록된 모든 피드를 스캔하고, 관련도 임계 이상인 질문의 답변 초안을 큐에 추가한다. */
export async function scanFeeds(): Promise<{
  fetched: number;
  newQuestions: number;
  queued: number;
}> {
  const feeds = await getFeeds();
  if (feeds.length === 0) return { fetched: 0, newQuestions: 0, queued: 0 };

  const [seen, queue] = await Promise.all([getSeen(), getQueue()]);
  let fetched = 0;
  let newQuestions = 0;
  let queued = 0;

  for (const feed of feeds) {
    const items = await fetchFeed(feed);
    fetched += items.length;
    for (const q of items) {
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      newQuestions++;

      const drafted = await classifyAndDraft(q);
      if (!drafted || drafted.confidence < RELEVANCE_THRESHOLD || !drafted.draft) continue;

      const now = new Date().toISOString();
      queue.unshift({
        id: `kin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        questionId: q.id,
        category: q.category,
        sourceUrl: q.url,
        title: q.title,
        body: q.body,
        confidence: drafted.confidence,
        draft: drafted.draft,
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      });
      queued++;
    }
  }

  await Promise.all([saveSeen(seen), saveQueue(queue)]);
  return { fetched, newQuestions, queued };
}

export async function updateQueueItem(
  id: string,
  patch: Partial<Pick<KinQueueItem, "draft" | "status">>,
): Promise<KinQueueItem | null> {
  const queue = await getQueue();
  const idx = queue.findIndex((q) => q.id === id);
  if (idx < 0) return null;
  const next: KinQueueItem = {
    ...queue[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  queue[idx] = next;
  await saveQueue(queue);
  return next;
}

/**
 * 지식iN 파트너 API 등록 완료 시 실제 게시 훅.
 * TODO(NAVER API): OAuth + 지식iN Answer API 연동.
 */
export async function postToNaver(_item: KinQueueItem): Promise<{ ok: false; reason: "TODO_NAVER_API" }> {
  return { ok: false, reason: "TODO_NAVER_API" };
}
