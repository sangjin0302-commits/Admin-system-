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
      const raw = (await callProxy("lawSearch.do", {
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
      const raw = (await callProxy("lawService.do", { ID: lawId })) as any;
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
      const raw = (await callProxy("prec.do", {
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
      const raw = (await callProxy("precInfoP.do", { ID: caseId })) as any;
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
      const raw = (await callProxy("expc.do", {
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

// ---------- 해석례 상세 ----------
export type InterpretationDetail = {
  interpId: string;
  title: string;
  agency: string;
  question: string;
  answer: string;
} | null;

export async function getInterpretationDetail(
  interpId: string
): Promise<InterpretationDetail> {
  if (!envReady()) return null;
  const key = `law:getInterpretationDetail:${JSON.stringify({ interpId })}`;
  return withCache<InterpretationDetail>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("expcInfoP.do", { ID: interpId })) as any;
      const root = raw?.Expc ?? raw?.법령해석례 ?? raw?.해석례 ?? raw;
      return {
        interpId,
        title: str(root?.안건명 ?? ""),
        agency: str(root?.회신기관명 ?? ""),
        question: str(root?.질의요지 ?? ""),
        answer: str(root?.회신내용 ?? "")
      };
    } catch (err) {
      logger.warn("law-api getInterpretationDetail failed", { interpId, err: String(err) });
      return null;
    }
  });
}

// ---------- 행정규칙 검색 ----------
export type AdminRuleItem = {
  ruleId: string;
  name: string;
  agency: string;
  date: string;
};

export async function searchAdminRule(
  keyword: string,
  limit = 10
): Promise<AdminRuleItem[]> {
  if (!envReady()) return [];
  const key = `law:searchAdminRule:${JSON.stringify({ keyword, limit })}`;
  return withCache<AdminRuleItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("admRul.do", {
        query: keyword,
        display: limit
      })) as any;
      const list = toArray<any>(raw?.AdmRulSearch?.admrul ?? raw?.admrul ?? raw?.행정규칙);
      return list.map((it) => ({
        ruleId: str(it?.행정규칙일련번호 ?? it?.id),
        name: str(it?.행정규칙명 ?? it?.name),
        agency: str(it?.소관부처명 ?? it?.agency),
        date: str(it?.발령일자 ?? it?.date)
      }));
    } catch (err) {
      logger.warn("law-api searchAdminRule failed", { keyword, err: String(err) });
      return [];
    }
  });
}

// ---------- 행정규칙 상세 ----------
export type AdminRuleDetail = {
  ruleId: string;
  name: string;
  agency: string;
  content: string;
} | null;

export async function getAdminRuleDetail(ruleId: string): Promise<AdminRuleDetail> {
  if (!envReady()) return null;
  const key = `law:getAdminRuleDetail:${JSON.stringify({ ruleId })}`;
  return withCache<AdminRuleDetail>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("admRulInfoP.do", { ID: ruleId })) as any;
      const root = raw?.AdmRulService ?? raw?.행정규칙 ?? raw;
      return {
        ruleId,
        name: str(root?.행정규칙명 ?? ""),
        agency: str(root?.소관부처명 ?? ""),
        content: str(root?.조문내용 ?? root?.내용 ?? root?.본문 ?? "")
      };
    } catch (err) {
      logger.warn("law-api getAdminRuleDetail failed", { ruleId, err: String(err) });
      return null;
    }
  });
}

// ---------- 별표·서식 검색 ----------
export type FormItem = {
  formId: string;
  formName: string;
  lawName: string;
  downloadUrl: string;
};

export async function searchForm(keyword: string, limit = 10): Promise<FormItem[]> {
  if (!envReady()) return [];
  const key = `law:searchForm:${JSON.stringify({ keyword, limit })}`;
  return withCache<FormItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("lsBylSearch.do", {
        query: keyword,
        display: limit
      })) as any;
      const list = toArray<any>(
        raw?.LsBylSearch?.lsbyl ?? raw?.lsbyl ?? raw?.별표별지
      );
      return list.map((it) => {
        const formId = str(it?.별표번호 ?? it?.id);
        const lawId = str(it?.법령ID ?? "");
        return {
          formId,
          formName: str(it?.별표명 ?? it?.name),
          lawName: str(it?.법령명한글 ?? it?.법령명 ?? ""),
          downloadUrl: lawId
            ? `https://www.law.go.kr/DRF/lawService.do?OC=&target=byl&MST=${lawId}&num=${formId}`
            : ""
        };
      });
    } catch (err) {
      logger.warn("law-api searchForm failed", { keyword, err: String(err) });
      return [];
    }
  });
}

// ---------- 특정 조문 ----------
export async function getLawArticleByJo(
  lawId: string,
  jo: string | number
): Promise<LawArticle | null> {
  if (!envReady()) return null;
  const key = `law:getLawArticleByJo:${JSON.stringify({ lawId, jo })}`;
  return withCache<LawArticle | null>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("lsJoService.do", { ID: lawId, JO: jo })) as any;
      const root = raw?.법령 ?? raw?.Law ?? raw;
      const a =
        toArray<any>(root?.조문?.조문단위 ?? root?.조문 ?? root?.articles)[0] ?? root;
      return {
        article: str(a?.조문번호 ?? jo),
        title: str(a?.조문제목 ?? ""),
        content: str(a?.조문내용 ?? a?.내용 ?? "")
      };
    } catch (err) {
      logger.warn("law-api getLawArticleByJo failed", { lawId, jo, err: String(err) });
      return null;
    }
  });
}

// ---------- 자치법규 ----------
export type OrdinanceItem = {
  ordinanceId: string;
  name: string;
  region: string;
  date: string;
};

export async function searchOrdinance(
  keyword: string,
  limit = 10
): Promise<OrdinanceItem[]> {
  if (!envReady()) return [];
  const key = `law:searchOrdinance:${JSON.stringify({ keyword, limit })}`;
  return withCache<OrdinanceItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("ordin.do", {
        query: keyword,
        display: limit
      })) as any;
      const list = toArray<any>(raw?.OrdinSearch?.ordin ?? raw?.ordin ?? raw?.자치법규);
      return list.map((it) => ({
        ordinanceId: str(it?.자치법규ID ?? it?.id),
        name: str(it?.자치법규명 ?? it?.name),
        region: str(it?.지자체기관명 ?? it?.region),
        date: str(it?.시행일자 ?? it?.date)
      }));
    } catch (err) {
      logger.warn("law-api searchOrdinance failed", { keyword, err: String(err) });
      return [];
    }
  });
}

// ---------- 조약 ----------
export type TreatyItem = {
  treatyId: string;
  name: string;
  counterpart: string;
  date: string;
};

export async function searchTreaty(
  keyword: string,
  limit = 10
): Promise<TreatyItem[]> {
  if (!envReady()) return [];
  const key = `law:searchTreaty:${JSON.stringify({ keyword, limit })}`;
  return withCache<TreatyItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = (await callProxy("trty.do", {
        query: keyword,
        display: limit
      })) as any;
      const list = toArray<any>(raw?.TrtySearch?.trty ?? raw?.trty ?? raw?.조약);
      return list.map((it) => ({
        treatyId: str(it?.조약일련번호 ?? it?.조약ID ?? it?.id),
        name: str(it?.조약명 ?? it?.name),
        counterpart: str(it?.체결상대국 ?? it?.상대국 ?? ""),
        date: str(it?.발효일자 ?? it?.체결일자 ?? it?.date)
      }));
    } catch (err) {
      logger.warn("law-api searchTreaty failed", { keyword, err: String(err) });
      return [];
    }
  });
}
