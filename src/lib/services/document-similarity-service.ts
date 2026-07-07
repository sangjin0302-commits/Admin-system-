/**
 * 문서 유사도·표절 감지.
 *
 * n-gram(글자 단위 5-gram) 교집합 기반 유사도 (Jaccard).
 * 비교 대상: 최근 DocumentDraft.bodyJson (title/text 추출) — 사무소 자체 자료만 사용.
 *
 * 저장:
 *   - 링크(재사용 표시): SiteSetting `document_similarity.links` — [{ newDocId, priorDocId, reason }]
 *   - 무시 목록(완전 새로 작성): SiteSetting `document_similarity.ignored` — [ids]
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const LINKS_KEY = "document_similarity.links";
const IGNORED_KEY = "document_similarity.ignored";
const NGRAM = 5;
const MAX_COMPARISONS = 200;

export type SimilarityMatchedSegment = {
  ngram: string;
  approxOffset: number;
};

export type SimilarDocumentRef = {
  id: string;
  title: string;
  inquiryId?: string;
  caseId?: string | null;
  createdAt: string;
  excerpt: string;
};

export type SimilarityResult = {
  similarityScore: number;
  mostSimilarDoc: SimilarDocumentRef | null;
  matchedSegments: SimilarityMatchedSegment[];
  comparedCount: number;
  ranking: Array<{ doc: SimilarDocumentRef; score: number }>;
  threshold: number;
};

function normalize(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

export function ngrams(text: string, n = NGRAM): Set<string> {
  const s = normalize(text);
  const out = new Set<string>();
  if (s.length < n) {
    out.add(s);
    return out;
  }
  for (let i = 0; i <= s.length - n; i++) {
    out.add(s.slice(i, i + n));
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function extractDraftText(bodyJson: string, title: string | null): string {
  try {
    const parsed = JSON.parse(bodyJson);
    if (typeof parsed === "string") return `${title ?? ""}\n${parsed}`;
    if (parsed && typeof parsed === "object") {
      // 흔한 필드 우선순위
      const cand =
        (parsed as Record<string, unknown>).text ??
        (parsed as Record<string, unknown>).body ??
        (parsed as Record<string, unknown>).content ??
        (parsed as Record<string, unknown>).draft ??
        "";
      if (typeof cand === "string") return `${title ?? ""}\n${cand}`;
      return `${title ?? ""}\n${JSON.stringify(parsed)}`;
    }
    return title ?? "";
  } catch {
    return `${title ?? ""}\n${bodyJson}`;
  }
}

async function loadIgnored(): Promise<Set<string>> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: IGNORED_KEY } });
    if (!row?.value) return new Set();
    const list = JSON.parse(row.value) as string[];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

export async function markIgnored(id: string): Promise<void> {
  const set = await loadIgnored();
  set.add(id);
  await prisma.siteSetting.upsert({
    where: { key: IGNORED_KEY },
    create: { key: IGNORED_KEY, value: JSON.stringify([...set]) },
    update: { value: JSON.stringify([...set]) },
  });
}

export type SimilarityLink = {
  newDocId: string;
  priorDocId: string;
  reason?: string;
  createdAt: string;
};

export async function linkAsReuse(
  newDocId: string,
  priorDocId: string,
  reason?: string
): Promise<SimilarityLink> {
  const row = await prisma.siteSetting.findUnique({ where: { key: LINKS_KEY } });
  const list: SimilarityLink[] = row?.value ? JSON.parse(row.value) : [];
  const link: SimilarityLink = { newDocId, priorDocId, reason, createdAt: new Date().toISOString() };
  list.unshift(link);
  await prisma.siteSetting.upsert({
    where: { key: LINKS_KEY },
    create: { key: LINKS_KEY, value: JSON.stringify(list.slice(0, 500)) },
    update: { value: JSON.stringify(list.slice(0, 500)) },
  });
  return link;
}

export async function listReuseLinks(): Promise<SimilarityLink[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: LINKS_KEY } });
  if (!row?.value) return [];
  try {
    return JSON.parse(row.value);
  } catch {
    return [];
  }
}

export async function checkSimilarity(
  newText: string,
  options: { excludeId?: string; threshold?: number; limit?: number } = {}
): Promise<SimilarityResult> {
  const threshold = options.threshold ?? 0.7;
  const limit = Math.min(options.limit ?? MAX_COMPARISONS, MAX_COMPARISONS);
  const newSet = ngrams(newText);
  const ignored = await loadIgnored();

  let priors: Array<{
    id: string;
    title: string | null;
    inquiryId: string;
    caseId: string | null;
    bodyJson: string;
    createdAt: Date;
  }> = [];
  try {
    priors = await prisma.documentDraft.findMany({
      where: { id: { notIn: [...ignored, options.excludeId ?? ""] } },
      select: {
        id: true,
        title: true,
        inquiryId: true,
        caseId: true,
        bodyJson: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (err) {
    logger.warn("[document-similarity] documentDraft 조회 실패", err);
    priors = [];
  }

  const ranking: Array<{ doc: SimilarDocumentRef; score: number; overlap: Set<string> }> = [];
  for (const p of priors) {
    const priorText = extractDraftText(p.bodyJson, p.title);
    const priorSet = ngrams(priorText);
    const score = jaccard(newSet, priorSet);
    if (score <= 0) continue;
    const overlap = new Set<string>();
    for (const g of newSet) if (priorSet.has(g)) overlap.add(g);
    ranking.push({
      doc: {
        id: p.id,
        title: p.title ?? "(제목 없음)",
        inquiryId: p.inquiryId,
        caseId: p.caseId,
        createdAt: p.createdAt.toISOString(),
        excerpt: priorText.slice(0, 200),
      },
      score,
      overlap,
    });
  }
  ranking.sort((a, b) => b.score - a.score);
  const top = ranking[0];
  const segments: SimilarityMatchedSegment[] = top
    ? Array.from(top.overlap)
        .slice(0, 20)
        .map((ngram) => ({ ngram, approxOffset: newText.indexOf(ngram) }))
    : [];
  return {
    similarityScore: top?.score ?? 0,
    mostSimilarDoc: top?.doc ?? null,
    matchedSegments: segments,
    comparedCount: priors.length,
    ranking: ranking.slice(0, 10).map(({ doc, score }) => ({ doc, score })),
    threshold,
  };
}

/**
 * 최근 초안에 대해 유사도 점수 상위 리스트 (관리자 UI용).
 */
export async function recentDraftsWithSimilarity(limit = 20): Promise<Array<{
  draft: SimilarDocumentRef;
  similarityScore: number;
  mostSimilarDocId?: string;
}>> {
  let recents: Array<{
    id: string;
    title: string | null;
    inquiryId: string;
    caseId: string | null;
    bodyJson: string;
    createdAt: Date;
  }> = [];
  try {
    recents = await prisma.documentDraft.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        inquiryId: true,
        caseId: true,
        bodyJson: true,
        createdAt: true,
      },
    });
  } catch (err) {
    logger.warn("[document-similarity] recent 조회 실패", err);
    return [];
  }
  const out: Array<{
    draft: SimilarDocumentRef;
    similarityScore: number;
    mostSimilarDocId?: string;
  }> = [];
  for (const r of recents) {
    const text = extractDraftText(r.bodyJson, r.title);
    const sim = await checkSimilarity(text, { excludeId: r.id, limit: 50 });
    out.push({
      draft: {
        id: r.id,
        title: r.title ?? "(제목 없음)",
        inquiryId: r.inquiryId,
        caseId: r.caseId,
        createdAt: r.createdAt.toISOString(),
        excerpt: text.slice(0, 200),
      },
      similarityScore: sim.similarityScore,
      mostSimilarDocId: sim.mostSimilarDoc?.id,
    });
  }
  return out;
}
