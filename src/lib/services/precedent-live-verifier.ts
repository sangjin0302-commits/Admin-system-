/**
 * 판례 인용 실시간 재확인.
 *
 * 우선순위:
 *   1. 로컬 precedent-database
 *   2. Lawbot precedent 검색 (LAWBOT_API_URL 있으면 GET /precedents/lookup?caseNo=...)
 *   3. law.go.kr 스크래핑 캐시 (SiteSetting `precedent_live.cache` 24h TTL)
 *
 * 상태: 폐기·변경·계속 유효 · 미확인
 * 통합: verifyCitations 결과의 precedent 항목에 대해 배치 재확인 함수 제공.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { listPrecedents } from "@/lib/services/precedent-database-service";
import { CITATION_PRECEDENT_REGEX } from "@/lib/services/citation-verifier-service";

const CACHE_KEY = "precedent_live.cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type PrecedentStatus = "valid" | "changed" | "abolished" | "unknown";

export type PrecedentLiveResult = {
  caseNo: string;
  exists: boolean;
  url?: string;
  currentStatus: PrecedentStatus;
  source: "local" | "lawbot" | "law.go.kr" | "cache" | "none";
  lastVerified: string;
  note?: string;
};

type CacheEntry = PrecedentLiveResult & { cachedAt: string };
type CacheData = Record<string, CacheEntry>;

async function readCache(): Promise<CacheData> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: CACHE_KEY } });
    if (!row?.value) return {};
    return JSON.parse(row.value) as CacheData;
  } catch {
    return {};
  }
}

async function writeCache(data: CacheData): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: CACHE_KEY },
    create: { key: CACHE_KEY, value: JSON.stringify(data) },
    update: { value: JSON.stringify(data) },
  });
}

export async function clearPrecedentCache(): Promise<void> {
  await writeCache({});
}

export function normalizeCaseNo(caseNo: string): string {
  return caseNo.replace(/\s+/g, "");
}

async function checkLocal(caseNo: string): Promise<PrecedentLiveResult | null> {
  const list = await listPrecedents();
  const target = normalizeCaseNo(caseNo);
  const hit = list.find((p) => {
    const n = normalizeCaseNo(p.caseNo);
    return n === target || n.endsWith(target) || target.endsWith(n);
  });
  if (!hit) return null;
  const tagStatus: PrecedentStatus = hit.tags?.some((t) => /폐기|폐지/.test(t))
    ? "abolished"
    : hit.tags?.some((t) => /변경/.test(t))
      ? "changed"
      : "valid";
  return {
    caseNo,
    exists: true,
    url: hit.url,
    currentStatus: tagStatus,
    source: "local",
    lastVerified: new Date().toISOString(),
    note: "로컬 판례 DB",
  };
}

async function checkLawbot(caseNo: string): Promise<PrecedentLiveResult | null> {
  const base = process.env.LAWBOT_API_URL;
  if (!base) return null;
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/precedents/lookup?caseNo=${encodeURIComponent(caseNo)}`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      exists?: boolean;
      url?: string;
      status?: PrecedentStatus;
      note?: string;
    };
    if (!data.exists) return null;
    return {
      caseNo,
      exists: true,
      url: data.url,
      currentStatus: data.status ?? "valid",
      source: "lawbot",
      lastVerified: new Date().toISOString(),
      note: data.note ?? "Lawbot 조회 확인",
    };
  } catch (err) {
    logger.warn("[precedent-live] lawbot 조회 실패", err);
    return null;
  }
}

async function checkLawGoKr(caseNo: string): Promise<PrecedentLiveResult | null> {
  // law.go.kr 는 스크래핑이 필요 — 안전을 위해 opt-in 환경변수.
  if (!process.env.LAW_GO_KR_SCRAPE_ENABLED) return null;
  try {
    const url = `https://www.law.go.kr/precSc.do?query=${encodeURIComponent(caseNo)}`;
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; EthosBot/1.0)", accept: "text/html" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const found = html.includes(caseNo.replace(/\s+/g, ""));
    if (!found) return null;
    const abolished = /폐기|폐지/.test(html);
    const changed = /변경/.test(html);
    return {
      caseNo,
      exists: true,
      url,
      currentStatus: abolished ? "abolished" : changed ? "changed" : "valid",
      source: "law.go.kr",
      lastVerified: new Date().toISOString(),
      note: "law.go.kr 스크래핑",
    };
  } catch (err) {
    logger.warn("[precedent-live] law.go.kr 스크래핑 실패", err);
    return null;
  }
}

export async function verifyPrecedentLive(
  caseNo: string,
  options: { skipCache?: boolean } = {}
): Promise<PrecedentLiveResult> {
  const normalized = normalizeCaseNo(caseNo);
  const cache = await readCache();
  const cached = cache[normalized];
  if (!options.skipCache && cached) {
    const age = Date.now() - new Date(cached.cachedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return { ...cached, source: "cache" };
    }
  }

  const local = await checkLocal(caseNo);
  if (local) {
    cache[normalized] = { ...local, cachedAt: new Date().toISOString() };
    await writeCache(cache);
    return local;
  }
  const lb = await checkLawbot(caseNo);
  if (lb) {
    cache[normalized] = { ...lb, cachedAt: new Date().toISOString() };
    await writeCache(cache);
    return lb;
  }
  const gk = await checkLawGoKr(caseNo);
  if (gk) {
    cache[normalized] = { ...gk, cachedAt: new Date().toISOString() };
    await writeCache(cache);
    return gk;
  }

  const miss: PrecedentLiveResult = {
    caseNo,
    exists: false,
    currentStatus: "unknown",
    source: "none",
    lastVerified: new Date().toISOString(),
    note: "모든 소스에서 미확인",
  };
  cache[normalized] = { ...miss, cachedAt: new Date().toISOString() };
  await writeCache(cache);
  return miss;
}

export async function batchVerifyPrecedentsInText(
  text: string,
  options: { skipCache?: boolean } = {}
): Promise<PrecedentLiveResult[]> {
  const seen = new Set<string>();
  const targets: string[] = [];
  for (const m of text.matchAll(CITATION_PRECEDENT_REGEX)) {
    const n = normalizeCaseNo(m[0]);
    if (seen.has(n)) continue;
    seen.add(n);
    targets.push(m[0]);
  }
  const out: PrecedentLiveResult[] = [];
  for (const t of targets) {
    out.push(await verifyPrecedentLive(t, options));
  }
  return out;
}

export async function getRecentFailures(limit = 20): Promise<PrecedentLiveResult[]> {
  const cache = await readCache();
  return Object.values(cache)
    .filter((c) => !c.exists || c.currentStatus === "abolished")
    .sort((a, b) => new Date(b.lastVerified).getTime() - new Date(a.lastVerified).getTime())
    .slice(0, limit);
}

export async function getCacheStats(): Promise<{ total: number; failures: number; valid: number; oldest?: string }>
{
  const cache = await readCache();
  const values = Object.values(cache);
  const failures = values.filter((v) => !v.exists || v.currentStatus === "abolished").length;
  const valid = values.filter((v) => v.exists && v.currentStatus === "valid").length;
  const oldest = values
    .map((v) => v.cachedAt)
    .sort()
    .shift();
  return { total: values.length, failures, valid, oldest };
}
