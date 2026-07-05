/**
 * 판례 벡터(의미) 검색.
 *
 * 우선순위:
 *  1) VOYAGE_API_KEY 있으면 Voyage AI 임베딩 (voyage-3)
 *  2) 없으면 Claude Haiku "유사도 점수" 프롬프트 폴백 (top 후보만)
 *  3) 어느 것도 실패하면 키워드 검색으로 우아하게 강등
 *
 * 인덱스는 인메모리 Map<precedentId, number[]>. 30분 TTL.
 * PGVector 필요 없음 — 판례가 수천 건 이하일 때 충분.
 */

import { listPrecedents, searchPrecedents, type Precedent } from "@/lib/services/precedent-database-service";
import { logger } from "@/lib/utils/logger";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

const INDEX_TTL_MS = 30 * 60_000;

type IndexEntry = { id: string; vec: number[] };
let _index: { at: number; entries: IndexEntry[]; precedents: Map<string, Precedent> } | null = null;
const _queryCache = new Map<string, { at: number; vec: number[] }>();

export type VectorSearchResult = {
  precedent: Precedent;
  score: number; // 0..1 cosine similarity
};

function docText(p: Precedent): string {
  return [p.caseNo, p.court, p.category, p.summary, p.keywords.join(" "), p.tags.join(" ")]
    .filter(Boolean)
    .join("\n");
}

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function embedVoyage(texts: string[]): Promise<number[][] | null> {
  const key = process.env.VOYAGE_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ input: texts, model: VOYAGE_MODEL }),
    });
    if (!res.ok) {
      logger.warn("[precedent-vector] voyage error", res.status);
      return null;
    }
    const data = await res.json();
    const list = data?.data as Array<{ embedding: number[] }> | undefined;
    if (!Array.isArray(list)) return null;
    return list.map((d) => d.embedding);
  } catch (err) {
    logger.warn("[precedent-vector] voyage exception", err);
    return null;
  }
}

/** Voyage 폴백 실패 시 Haiku 로 후보 상위 후보들을 상대 점수화. */
async function haikuRerank(
  query: string,
  candidates: Precedent[]
): Promise<VectorSearchResult[] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || candidates.length === 0) return null;
  const items = candidates.slice(0, 20).map((p, i) => ({
    idx: i,
    id: p.id,
    text: `${p.caseNo} · ${p.category} · ${p.summary.slice(0, 300)}`,
  }));
  const prompt = `사용자 검색 질의와 판례 목록을 보고, 각 판례가 질의와 얼마나 의미적으로 유사한지 0~1 점수로 매기세요.
질의: "${query}"

판례 목록:
${items.map((it) => `[${it.idx}] ${it.text}`).join("\n")}

JSON 배열만 출력: [{"idx": number, "score": number}, ...]. 마크다운 금지.`;
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
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.content?.[0]?.text?.trim() ?? "";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Array<{ idx: number; score: number }>;
    const results: VectorSearchResult[] = [];
    for (const r of parsed) {
      const item = items[r.idx];
      if (!item) continue;
      const p = candidates.find((c) => c.id === item.id);
      if (!p) continue;
      const score = typeof r.score === "number" ? Math.max(0, Math.min(1, r.score)) : 0;
      results.push({ precedent: p, score });
    }
    return results.sort((a, b) => b.score - a.score);
  } catch (err) {
    logger.warn("[precedent-vector] haiku rerank exception", err);
    return null;
  }
}

/** 인덱스 재빌드 (Voyage 있을 때만 실제 임베딩). */
export async function rebuildIndex(): Promise<{ ok: boolean; count: number; mode: "voyage" | "none" }> {
  const precedents = await listPrecedents();
  const pMap = new Map(precedents.map((p) => [p.id, p]));
  const embeddings = await embedVoyage(precedents.map(docText));
  if (!embeddings) {
    _index = { at: Date.now(), entries: [], precedents: pMap };
    return { ok: true, count: precedents.length, mode: "none" };
  }
  const entries: IndexEntry[] = precedents.map((p, i) => ({ id: p.id, vec: embeddings[i] }));
  _index = { at: Date.now(), entries, precedents: pMap };
  return { ok: true, count: entries.length, mode: "voyage" };
}

async function ensureIndex(): Promise<void> {
  if (_index && Date.now() - _index.at < INDEX_TTL_MS) return;
  await rebuildIndex();
}

async function embedQuery(query: string): Promise<number[] | null> {
  const cached = _queryCache.get(query);
  if (cached && Date.now() - cached.at < INDEX_TTL_MS) return cached.vec;
  const arr = await embedVoyage([query]);
  if (!arr || !arr[0]) return null;
  _queryCache.set(query, { at: Date.now(), vec: arr[0] });
  if (_queryCache.size > 200) {
    const first = _queryCache.keys().next().value;
    if (first) _queryCache.delete(first);
  }
  return arr[0];
}

/**
 * 의미 기반 검색. 우선 Voyage 임베딩, 없으면 Haiku, 없으면 키워드로 강등.
 * 스코어 0..1 (cosine 또는 Haiku 판단).
 */
export async function searchByMeaning(
  query: string,
  topK = 10
): Promise<VectorSearchResult[]> {
  const q = (query ?? "").trim();
  if (!q) return [];
  await ensureIndex();
  if (!_index) return [];

  // Case A: Voyage 임베딩 있음 → 코사인 유사도
  if (_index.entries.length > 0) {
    const qv = await embedQuery(q);
    if (qv) {
      const scored = _index.entries.map((e) => ({
        id: e.id,
        score: cosine(qv, e.vec),
      }));
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, topK);
      return top
        .map((s) => {
          const p = _index!.precedents.get(s.id);
          return p ? { precedent: p, score: s.score } : null;
        })
        .filter((r): r is VectorSearchResult => r !== null && r.score > 0);
    }
  }

  // Case B: Haiku 리랭킹 (키워드 매칭으로 후보 축소 후)
  const candidates = await searchPrecedents(q);
  const fallbackCandidates =
    candidates.length > 0 ? candidates : Array.from(_index.precedents.values()).slice(0, 20);
  const reranked = await haikuRerank(q, fallbackCandidates);
  if (reranked) return reranked.slice(0, topK);

  // Case C: 우아한 강등 — 키워드 검색 결과에 균등 점수
  return candidates.slice(0, topK).map((p) => ({ precedent: p, score: 0.5 }));
}

/** 관리자용 진단 정보 */
export function getIndexStatus(): {
  built: boolean;
  builtAt: string | null;
  count: number;
  mode: "voyage" | "none" | "not-built";
  ttlSecondsLeft: number;
} {
  if (!_index) {
    return { built: false, builtAt: null, count: 0, mode: "not-built", ttlSecondsLeft: 0 };
  }
  return {
    built: true,
    builtAt: new Date(_index.at).toISOString(),
    count: _index.entries.length,
    mode: _index.entries.length > 0 ? "voyage" : "none",
    ttlSecondsLeft: Math.max(0, Math.floor((INDEX_TTL_MS - (Date.now() - _index.at)) / 1000)),
  };
}
