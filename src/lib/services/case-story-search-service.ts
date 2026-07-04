/**
 * 성공 사례(CaseStudy + 기본 샘플) 대상 자연어 검색.
 * 벡터 DB 없이 키워드 + 카테고리 매칭.
 * 랭킹: 제목 완전일치 > 제목 부분일치 > 본문 일치 > 카테고리 일치
 */

import { listPublicCaseStudies, type MergedCase } from "@/lib/services/case-studies";

export type CaseMatch = {
  slug: string;
  category: string;
  categoryLabel: string;
  title: string;
  summary: string;
  outcome: string;
  duration: string;
  score: number;
  reason: "title_exact" | "title_partial" | "body" | "category";
};

const SCORE_TITLE_EXACT = 100;
const SCORE_TITLE_PARTIAL = 60;
const SCORE_BODY = 25;
const SCORE_CATEGORY = 10;

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s,·・、\-_/()[\]{}"'?!.:;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function scoreCase(query: string, tokens: string[], c: MergedCase): CaseMatch | null {
  const title = c.title.toLowerCase();
  const summary = c.summary.toLowerCase();
  const outcome = c.outcome.toLowerCase();
  const category = c.category.toLowerCase();
  const categoryLabel = c.categoryLabel.toLowerCase();
  const body = `${summary} ${outcome}`;
  const q = query.toLowerCase().trim();

  let score = 0;
  let reason: CaseMatch["reason"] | null = null;

  if (q && title === q) {
    score += SCORE_TITLE_EXACT;
    reason = "title_exact";
  } else if (q && title.includes(q)) {
    score += SCORE_TITLE_PARTIAL;
    reason = "title_partial";
  }

  for (const t of tokens) {
    if (!t) continue;
    if (title.includes(t)) {
      score += SCORE_TITLE_PARTIAL / 2;
      reason ??= "title_partial";
    }
    if (body.includes(t)) {
      score += SCORE_BODY;
      reason ??= "body";
    }
    if (category.includes(t) || categoryLabel.includes(t)) {
      score += SCORE_CATEGORY;
      reason ??= "category";
    }
  }

  if (score <= 0 || !reason) return null;

  return {
    slug: c.slug,
    category: c.category,
    categoryLabel: c.categoryLabel,
    title: c.title,
    summary: c.summary,
    outcome: c.outcome,
    duration: c.duration,
    score,
    reason
  };
}

export async function searchCaseStories(query: string, limit = 12): Promise<CaseMatch[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tokens = tokenize(trimmed);
  const cases = await listPublicCaseStudies();

  const matches: CaseMatch[] = [];
  for (const c of cases) {
    const m = scoreCase(trimmed, tokens, c);
    if (m) matches.push(m);
  }

  matches.sort((a, b) => b.score - a.score);
  const safeLimit = Math.max(1, Math.min(50, limit));
  return matches.slice(0, safeLimit);
}
