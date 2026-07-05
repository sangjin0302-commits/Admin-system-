/**
 * RAG 챗봇 — 사무소 전체 지식(BlogPost, CaseStudy, Precedent, FAQ)에서 검색 → Haiku 답변.
 *
 * 저장:
 *   - "rag.logs" (최근 200건 로그, 관리자 모니터용)
 *   - "rag.feedback.<logId>" (thumbs up/down)
 */

import { prisma } from "@/lib/prisma/client";
import { listPrecedents } from "@/lib/services/precedent-database-service";
import { logger } from "@/lib/utils/logger";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const LOGS_KEY = "rag.logs";
const MAX_LOGS = 200;

export type RagSource = {
  type: "blog" | "case_study" | "precedent" | "faq";
  id: string;
  title: string;
  snippet: string;
  url?: string;
  score: number;
};

export type RagAnswer = {
  answer: string;
  sources: RagSource[];
  logId: string;
  answeredAt: string;
  confidence: "high" | "medium" | "low";
};

export type RagLog = {
  id: string;
  question: string;
  answer: string;
  sources: Array<{ type: string; id: string; title: string }>;
  confidence: string;
  createdAt: string;
  feedback?: "up" | "down";
};

function newId(): string {
  return `rag_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function tokenize(text: string): string[] {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function scoreOverlap(queryTokens: string[], docText: string): number {
  if (queryTokens.length === 0) return 0;
  const docLower = docText.toLowerCase();
  let hits = 0;
  for (const t of queryTokens) {
    if (docLower.includes(t)) hits++;
  }
  return hits / queryTokens.length;
}

function excerpt(text: string, queryTokens: string[], size = 240): string {
  const src = text ?? "";
  if (src.length <= size) return src;
  const lower = src.toLowerCase();
  let pos = -1;
  for (const t of queryTokens) {
    const idx = lower.indexOf(t);
    if (idx >= 0) {
      pos = idx;
      break;
    }
  }
  if (pos < 0) return src.slice(0, size);
  const start = Math.max(0, pos - 60);
  return (start > 0 ? "…" : "") + src.slice(start, start + size) + (start + size < src.length ? "…" : "");
}

async function collectSources(question: string, topK = 5): Promise<RagSource[]> {
  const tokens = tokenize(question);
  if (tokens.length === 0) return [];
  const bucket: RagSource[] = [];

  // Blogs
  try {
    const blogs = await prisma.blogPost.findMany({
      where: { published: true },
      select: { id: true, slug: true, title: true, excerpt: true, body: true },
      take: 200,
      orderBy: { publishedAt: "desc" },
    });
    for (const b of blogs) {
      const text = `${b.title}\n${b.excerpt}\n${b.body}`;
      const score = scoreOverlap(tokens, text);
      if (score > 0) {
        bucket.push({
          type: "blog",
          id: b.id,
          title: b.title,
          snippet: excerpt(b.body || b.excerpt, tokens),
          url: `/blog/${b.slug}`,
          score,
        });
      }
    }
  } catch (err) {
    logger.warn("[rag] blogs fail", err);
  }

  // CaseStudy
  try {
    const cs = await prisma.caseStudy.findMany({
      where: { published: true },
      select: { id: true, title: true, summary: true, outcome: true, category: true },
      take: 100,
    });
    for (const c of cs) {
      const text = `${c.title}\n${c.summary}\n${c.outcome}\n${c.category}`;
      const score = scoreOverlap(tokens, text);
      if (score > 0) {
        bucket.push({
          type: "case_study",
          id: c.id,
          title: c.title,
          snippet: excerpt(`${c.summary}\n결과: ${c.outcome}`, tokens),
          score,
        });
      }
    }
  } catch (err) {
    logger.warn("[rag] case studies fail", err);
  }

  // Precedents
  try {
    const precs = await listPrecedents();
    for (const p of precs) {
      const text = `${p.caseNo}\n${p.summary}\n${p.keywords.join(" ")}\n${p.category}`;
      const score = scoreOverlap(tokens, text);
      if (score > 0) {
        bucket.push({
          type: "precedent",
          id: p.id,
          title: `${p.caseNo} (${p.court})`,
          snippet: excerpt(p.summary, tokens),
          url: p.url,
          score,
        });
      }
    }
  } catch (err) {
    logger.warn("[rag] precedents fail", err);
  }

  // FAQ from SiteSetting home.faq (Q :: A 라인)
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "home.faq" } });
    if (row?.value) {
      const lines = row.value.split("\n").filter((l) => l.includes("::"));
      for (const line of lines) {
        const [q, a] = line.split("::").map((s) => s.trim());
        if (!q || !a) continue;
        const text = `${q}\n${a}`;
        const score = scoreOverlap(tokens, text);
        if (score > 0) {
          bucket.push({
            type: "faq",
            id: `faq_${Buffer.from(q).toString("base64").slice(0, 12)}`,
            title: q,
            snippet: a.slice(0, 240),
            score,
          });
        }
      }
    }
  } catch (err) {
    logger.warn("[rag] faq fail", err);
  }

  bucket.sort((a, b) => b.score - a.score);
  return bucket.slice(0, topK);
}

async function readLogs(): Promise<RagLog[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: LOGS_KEY } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as RagLog[]) : [];
  } catch {
    return [];
  }
}

async function writeLogs(list: RagLog[]): Promise<void> {
  const value = JSON.stringify(list.slice(0, MAX_LOGS));
  await prisma.siteSetting.upsert({
    where: { key: LOGS_KEY },
    create: { key: LOGS_KEY, value },
    update: { value },
  });
}

async function appendLog(entry: RagLog): Promise<void> {
  const list = await readLogs();
  list.unshift(entry);
  await writeLogs(list);
}

/**
 * RAG 답변. Anthropic 미설정 시 요약 응답으로 폴백.
 */
export async function askWithRag(
  question: string,
  options: { topK?: number } = {}
): Promise<RagAnswer> {
  const sources = await collectSources(question, options.topK ?? 5);
  const logId = newId();
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  const confidence: RagAnswer["confidence"] =
    sources.length >= 3 && sources[0]?.score >= 0.5
      ? "high"
      : sources.length >= 1
        ? "medium"
        : "low";

  if (!apiKey || sources.length === 0) {
    const fallback =
      sources.length === 0
        ? "죄송합니다. 관련 자료를 찾지 못했습니다. 더 구체적으로 질문해 주시거나 상담 예약을 남겨주세요."
        : sources.map((s) => `• ${s.title}: ${s.snippet}`).join("\n");
    const answer: RagAnswer = {
      answer: fallback,
      sources,
      logId,
      answeredAt: new Date().toISOString(),
      confidence,
    };
    await appendLog({
      id: logId,
      question,
      answer: fallback,
      sources: sources.map((s) => ({ type: s.type, id: s.id, title: s.title })),
      confidence,
      createdAt: answer.answeredAt,
    });
    return answer;
  }

  const context = sources
    .map((s, i) => `[${i + 1}] (${s.type}) ${s.title}\n${s.snippet}`)
    .join("\n\n");
  const system = `당신은 ETHOS 행정사사무소의 한국어 지식 챗봇입니다.
- 아래 [컨텍스트]에서만 답변 근거를 찾으세요. 없는 정보는 만들지 마세요.
- 답변 끝에 참조한 번호를 [1] [2] 처럼 인용하세요.
- 3-5문장으로 간결하게 답하세요.
- 법률 조언이 필요한 경우 반드시 "정확한 검토는 상담을 통해 진행 가능합니다"라고 안내하세요.`;
  const userMsg = `[컨텍스트]\n${context}\n\n[질문]\n${question}`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 700,
        system,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      logger.warn("[rag] anthropic error", res.status, err);
      throw new Error(`anthropic ${res.status}`);
    }
    const data = await res.json();
    const answer = (data?.content?.[0]?.text ?? "").trim() || "답변을 생성하지 못했습니다.";
    const result: RagAnswer = {
      answer,
      sources,
      logId,
      answeredAt: new Date().toISOString(),
      confidence,
    };
    await appendLog({
      id: logId,
      question,
      answer,
      sources: sources.map((s) => ({ type: s.type, id: s.id, title: s.title })),
      confidence,
      createdAt: result.answeredAt,
    });
    return result;
  } catch (err) {
    logger.warn("[rag] fallback", err);
    const fallback = sources.map((s) => `• ${s.title}: ${s.snippet}`).join("\n");
    const result: RagAnswer = {
      answer: fallback || "답변을 생성하지 못했습니다.",
      sources,
      logId,
      answeredAt: new Date().toISOString(),
      confidence: "low",
    };
    await appendLog({
      id: logId,
      question,
      answer: result.answer,
      sources: sources.map((s) => ({ type: s.type, id: s.id, title: s.title })),
      confidence: "low",
      createdAt: result.answeredAt,
    });
    return result;
  }
}

export async function submitFeedback(logId: string, feedback: "up" | "down"): Promise<boolean> {
  const list = await readLogs();
  const idx = list.findIndex((l) => l.id === logId);
  if (idx < 0) return false;
  list[idx].feedback = feedback;
  await writeLogs(list);
  return true;
}

export async function listRecentLogs(limit = 100): Promise<RagLog[]> {
  const list = await readLogs();
  return list.slice(0, limit);
}

/** 관리자 콘텐츠 갭 감지: 응답 소스 <2 이거나 down 피드백. */
export async function detectContentGaps(): Promise<Array<{ question: string; count: number; reason: string }>> {
  const list = await readLogs();
  const bucket = new Map<string, { count: number; reasons: Set<string> }>();
  for (const l of list) {
    const key = l.question.trim().slice(0, 100).toLowerCase();
    const entry = bucket.get(key) ?? { count: 0, reasons: new Set<string>() };
    entry.count++;
    if (l.sources.length < 2) entry.reasons.add("소스부족");
    if (l.confidence === "low") entry.reasons.add("확신도낮음");
    if (l.feedback === "down") entry.reasons.add("부정피드백");
    bucket.set(key, entry);
  }
  const out: Array<{ question: string; count: number; reason: string }> = [];
  for (const [q, v] of bucket) {
    if (v.reasons.size === 0) continue;
    out.push({ question: q, count: v.count, reason: Array.from(v.reasons).join(", ") });
  }
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, 30);
}
