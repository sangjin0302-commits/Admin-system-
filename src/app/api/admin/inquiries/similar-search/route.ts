/**
 * AAA7 (XX5): 유사 문의 검색 (키워드 기반).
 *
 * GET /api/admin/inquiries/similar-search?q=텍스트
 * Response: { results: Array<{ id, title, contactName, status, score, snippet }> }
 *
 * 임베딩 없이 tokenize + LIKE 매칭 + score 계산.
 *
 * Feature flag: `inquiry_similar_search`
 */

import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STOPWORDS = new Set([
  "이", "가", "을", "를", "은", "는", "의", "에", "와", "과", "도", "만",
  "and", "or", "the", "a", "an", "in", "on", "at", "to",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .slice(0, 12);
}

export async function GET(req: Request) {
  const api = createAdminRequestContext("admin.inquiries.similar-search");
  if (!(await isFeatureEnabled("inquiry_similar_search"))) {
    return api.error(403, "유사 검색 비활성", { code: "FEATURE_DISABLED" });
  }
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const excludeId = url.searchParams.get("excludeId") ?? undefined;
    if (q.length < 2) return api.error(400, "q 2자 이상 필요", { code: "INVALID_INPUT" });

    const tokens = tokenize(q);
    if (tokens.length === 0) return api.ok({ results: [] });

    // OR 매칭 candidate 조회 (title contains any token)
    const candidates = await prisma.inquiry.findMany({
      where: {
        AND: [
          excludeId ? { id: { not: excludeId } } : {},
          {
            OR: tokens.flatMap((t) => [
              { title: { contains: t } },
              { description: { contains: t } },
            ]),
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        contactName: true,
        status: true,
        createdAt: true,
        inquiryType: true,
      },
      take: 100,
      orderBy: { updatedAt: "desc" },
    });

    // Score = title match count * 2 + description match count
    const scored = candidates.map((c) => {
      const titleLower = c.title.toLowerCase();
      const descLower = c.description.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (titleLower.includes(t)) score += 2;
        if (descLower.includes(t)) score += 1;
      }
      const snippet = c.description.slice(0, 120);
      return {
        id: c.id,
        title: c.title,
        contactName: c.contactName,
        status: c.status,
        inquiryType: c.inquiryType,
        createdAt: c.createdAt,
        score,
        snippet,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return api.ok({ results: scored.slice(0, 10) });
  } catch (err) {
    api.logError(err);
    return api.error(500, "검색 실패", { code: "SEARCH_FAILED" });
  }
}
