/**
 * 국가법령정보센터(법제처) API 클라이언트
 *
 * IP 화이트리스트 제약으로 Vercel에서 직접 호출 불가 → Lightsail 프록시 경유.
 * 프록시: http://3.36.175.81:8080  (systemd: lawbot-proxy)
 * 경로: /drf/{endpoint}  →  law.go.kr/DRF/{endpoint}.do
 */

import { logger } from "@/lib/utils/logger";
import { withCache } from "@/lib/services/cache-service";

const LAW_PROXY_URL = process.env.LAW_PROXY_URL || "http://3.36.175.81:8080";
const LAW_PROXY_TOKEN = process.env.LAW_PROXY_TOKEN || "";
const LAW_OC = process.env.LAW_OC || "";
const CACHE_TTL_DAY = 86400;
const PROXY_TIMEOUT_MS = 10_000;

function envReady(): boolean {
  return Boolean(LAW_PROXY_TOKEN && LAW_OC);
}

async function callProxy(
  endpoint: string,
  params: Record<string, string | number>
): Promise<unknown> {
  const qs = new URLSearchParams({
    OC: LAW_OC,
    type: "JSON",
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    )
  });
  const url = `${LAW_PROXY_URL}/drf/${endpoint}?${qs.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-Proxy-Token": LAW_PROXY_TOKEN },
      signal: controller.signal,
      cache: "no-store"
    });
    if (!res.ok) {
      throw new Error(`law proxy ${endpoint} ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") return [v as T];
  return [];
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

// ---------- 법령 검색 ----------
export type LawSearchItem = {
  lawId: string;
  name: string;
  lawType: string;
  effectiveDate: string;
  promulgationNo: string;
};

export async function searchLaw(
  keyword: string,
  limit = 10
): Promise<LawSearchItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing (LAW_OC/LAW_PROXY_TOKEN) — returning []");
    return [];
  }
  const key = `law:searchLaw:${JSON.stringify({ keyword, limit })}`;
  return withCache<LawSearchItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("lawsearch", {
        query: keyword,
        display: limit
      })) as any;
      const list = toArray<any>(raw?.LawSearch?.law ?? raw?.law);
      return list.map((it) => ({
        lawId: str(it?.법령ID ?? it?.MST ?? it?.id),
        name: str(it?.법령명한글 ?? it?.법령명 ?? it?.name),
        lawType: str(it?.법령구분명 ?? it?.lawType),
        effectiveDate: str(it?.시행일자 ?? it?.effectiveDate),
        promulgationNo: str(it?.공포번호 ?? it?.promulgationNo)
      }));
    } catch (err) {
      logger.warn("law-api searchLaw failed", { keyword, err: String(err) });
      return [];
    }
  });
}

// ---------- 법령 본문 (조문) ----------
export type LawArticle = { article: string; title: string; content: string };
export type LawArticleResult = {
  lawId: string;
  name: string;
  articles: LawArticle[];
} | null;

export async function getLawArticle(lawId: string): Promise<LawArticleResult> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning null");
    return null;
  }
  const key = `law:getLawArticle:${JSON.stringify({ lawId })}`;
  return withCache<LawArticleResult>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("lawservice", { ID: lawId })) as any;
      const root = raw?.법령 ?? raw?.Law ?? raw;
      const basic = root?.기본정보 ?? root?.basic ?? {};
      const arts = toArray<any>(
        root?.조문?.조문단위 ??
          root?.조문 ??
          root?.articles ??
          []
      );
      return {
        lawId,
        name: str(basic?.법령명_한글 ?? basic?.법령명 ?? ""),
        articles: arts.map((a) => ({
          article: str(a?.조문번호 ?? a?.조문식별번호 ?? ""),
          title: str(a?.조문제목 ?? ""),
          content: str(a?.조문내용 ?? a?.내용 ?? "")
        }))
      };
    } catch (err) {
      logger.warn("law-api getLawArticle failed", { lawId, err: String(err) });
      return null;
    }
  });
}

// ---------- 판례 검색 ----------
export type PrecedentSearchItem = {
  caseId: string;
  caseName: string;
  courtName: string;
  caseNumber: string;
  judgmentDate: string;
  summary: string;
};

export async function searchPrecedent(
  keyword: string,
  limit = 10
): Promise<PrecedentSearchItem[]> {
  if (!envReady()) return [];
  const key = `law:searchPrecedent:${JSON.stringify({ keyword, limit })}`;
  return withCache<PrecedentSearchItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("prec", {
        query: keyword,
        display: limit
      })) as any;
      const list = toArray<any>(raw?.PrecSearch?.prec ?? raw?.prec);
      return list.map((it) => ({
        caseId: str(it?.판례일련번호 ?? it?.id),
        caseName: str(it?.사건명 ?? it?.name),
        courtName: str(it?.법원명 ?? it?.court),
        caseNumber: str(it?.사건번호 ?? it?.caseNumber),
        judgmentDate: str(it?.선고일자 ?? it?.date),
        summary: str(it?.판시사항 ?? it?.summary ?? "")
      }));
    } catch (err) {
      logger.warn("law-api searchPrecedent failed", { keyword, err: String(err) });
      return [];
    }
  });
}

// ---------- 판례 상세 ----------
export type PrecedentDetail = {
  caseId: string;
  caseName: string;
  fullText: string;
  keywords: string[];
  relatedLaws: string[];
} | null;

export async function getPrecedentDetail(
  caseId: string
): Promise<PrecedentDetail> {
  if (!envReady()) return null;
  const key = `law:getPrecedentDetail:${JSON.stringify({ caseId })}`;
  return withCache<PrecedentDetail>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("precService", { ID: caseId })) as any;
      const root = raw?.PrecService ?? raw?.판례 ?? raw;
      const kw = str(root?.판시사항 ?? root?.판결요지 ?? "")
        .split(/[,、·\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      const related = toArray<any>(root?.참조조문 ?? root?.관련법령 ?? []).map(
        (r) => str(typeof r === "string" ? r : r?.name ?? r?.조문 ?? "")
      );
      return {
        caseId,
        caseName: str(root?.사건명 ?? ""),
        fullText: str(root?.판례내용 ?? root?.전문 ?? ""),
        keywords: kw,
        relatedLaws: related.filter(Boolean)
      };
    } catch (err) {
      logger.warn("law-api getPrecedentDetail failed", { caseId, err: String(err) });
      return null;
    }
  });
}

// ---------- 법령해석례 ----------
export type InterpretationItem = {
  interpId: string;
  title: string;
  agency: string;
  date: string;
  summary: string;
};

export async function searchInterpretation(
  keyword: string,
  limit = 10
): Promise<InterpretationItem[]> {
  if (!envReady()) return [];
  const key = `law:searchInterpretation:${JSON.stringify({ keyword, limit })}`;
  return withCache<InterpretationItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("expc", {
        query: keyword,
        display: limit
      })) as any;
      const list = toArray<any>(raw?.Expc?.expc ?? raw?.expc);
      return list.map((it) => ({
        interpId: str(it?.해석례일련번호 ?? it?.id),
        title: str(it?.안건명 ?? it?.title),
        agency: str(it?.회신기관명 ?? it?.agency),
        date: str(it?.회신일자 ?? it?.date),
        summary: str(it?.질의요지 ?? it?.summary ?? "")
      }));
    } catch (err) {
      logger.warn("law-api searchInterpretation failed", { keyword, err: String(err) });
      return [];
    }
  });
}
