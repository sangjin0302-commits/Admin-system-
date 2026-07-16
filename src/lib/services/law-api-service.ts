/**
 * 국가법령정보센터(법제처) DRF API 클라이언트 — 행정사 업무 특화
 *
 * DRF는 엔드포인트가 lawSearch.do / lawService.do 2개뿐이며,
 * target 파라미터로 도메인을 구분한다. wrapper key는 target마다 다르다.
 * Vercel IP 화이트리스트 불가 → Lightsail 프록시(3.36.175.81:8080) 경유.
 */

import { logger } from "@/lib/utils/logger";
import { withCache } from "@/lib/services/cache-service";

const LAW_PROXY_URL = process.env.LAW_PROXY_URL || "http://3.36.175.81:8080";
const LAW_PROXY_TOKEN = process.env.LAW_PROXY_TOKEN || "";
const LAW_OC = process.env.LAW_OC || "";
const CACHE_TTL_DAY = 86400;
const PROXY_TIMEOUT_MS = 10_000;
const LAW_BASE_URL = "https://www.law.go.kr";

function envReady(): boolean {
  return Boolean(LAW_PROXY_TOKEN && LAW_OC);
}

function toArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") return [v as T];
  return [];
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

// ---------- DRF 호출 ----------

function buildUrl(
  endpoint: string,
  params: Record<string, string | number>,
  type: "JSON" | "XML"
): string {
  const qs = new URLSearchParams({
    OC: LAW_OC,
    type,
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    )
  });
  return `${LAW_PROXY_URL}/drf/${endpoint}?${qs.toString()}`;
}

async function fetchProxy(url: string, endpoint: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-Proxy-Token": LAW_PROXY_TOKEN },
      signal: controller.signal,
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`law proxy ${endpoint} ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function callDrf(
  endpoint: "lawSearch.do" | "lawService.do",
  params: Record<string, string | number>
): Promise<any> {
  const data = await fetchProxy(buildUrl(endpoint, params, "JSON"), endpoint);
  // 프록시는 non-JSON content-type일 때 {raw, status_code}로 감싼다
  if (data && typeof data === "object" && typeof data.raw === "string") {
    if (!data.raw.trim()) return {};
    try {
      return JSON.parse(data.raw);
    } catch {
      return { __raw: data.raw };
    }
  }
  // 인증 실패 감지
  if (data?.result === "사용자 정보 검증에 실패하였습니다.") {
    throw new Error("법제처 API 사용자 검증 실패 — OC/IP 등록 확인 필요");
  }
  return data;
}

async function callDrfXml(
  endpoint: "lawService.do",
  params: Record<string, string | number>
): Promise<string> {
  const data = await fetchProxy(buildUrl(endpoint, params, "XML"), endpoint);
  if (data && typeof data === "object") {
    if (typeof data.raw === "string") return data.raw;
    if (typeof data.__raw === "string") return data.__raw;
  }
  return typeof data === "string" ? data : "";
}

// ---------- XML 헬퍼 ----------

function xmlTag(block: string, tag: string): string {
  const m = block.match(
    new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)
  );
  return m ? m[1].trim() : "";
}

function xmlBlocks(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))].map(
    (m) => m[1]
  );
}

function toAbsoluteUrl(path: string): string {
  if (!path) return "";
  return path.startsWith("/") ? `${LAW_BASE_URL}${path}` : path;
}

// ---------- 부처별 유권해석 target ----------

export const MINISTRY_TARGETS = {
  molit: { target: "molitCgmExpc", label: "국토교통부" },
  moel: { target: "moelCgmExpc", label: "고용노동부" },
  nts: { target: "ntsCgmExpc", label: "국세청" }
} as const;
export type MinistryKey = keyof typeof MINISTRY_TARGETS;

// ---------- 결과 타입 ----------

export type LawSearchItem = {
  mst: string;
  lawId: string;
  name: string;
  lawType: string;
  effectiveDate: string;
  promulgationNo: string;
  ministry: string;
};

export type PrecedentSearchItem = {
  caseId: string;
  caseName: string;
  courtName: string;
  caseNumber: string;
  judgmentDate: string;
  summary: string;
};

export type InterpretationItem = {
  interpId: string;
  title: string;
  agency: string;
  date: string;
  summary: string;
};

export type AdminJudgmentItem = {
  deccId: string;
  caseName: string;
  caseNumber: string;
  agency: string;
  date: string;
};

export type AdminRuleItem = {
  ruleId: string;
  name: string;
  agency: string;
  date: string;
  ruleType: string;
};

export type OrdinanceItem = {
  ordinanceId: string;
  name: string;
  region: string;
  date: string;
};

export type FormItem = {
  formId: string;
  formName: string;
  formType: string;
  lawName: string;
  mst: string;
};

export type MinistryInterpItem = {
  interpId: string;
  title: string;
  agency: string;
  date: string;
  question: string;
};

export type TreatyItem = {
  treatyId: string;
  name: string;
  counterpart: string;
  date: string;
};

// ---------- 매핑 헬퍼 ----------

function mapLaw(it: any): LawSearchItem {
  return {
    mst: str(it?.법령일련번호 ?? it?.법령MST ?? it?.MST ?? ""),
    lawId: str(it?.법령ID ?? ""),
    name: str(it?.법령명한글 ?? it?.법령명 ?? ""),
    lawType: str(it?.법령구분명 ?? ""),
    effectiveDate: str(it?.시행일자 ?? ""),
    promulgationNo: str(it?.공포번호 ?? ""),
    ministry: str(it?.소관부처명 ?? "")
  };
}

function mapPrec(it: any): PrecedentSearchItem {
  return {
    caseId: str(it?.판례일련번호 ?? ""),
    caseName: str(it?.사건명 ?? ""),
    courtName: str(it?.법원명 ?? ""),
    caseNumber: str(it?.사건번호 ?? ""),
    judgmentDate: str(it?.선고일자 ?? ""),
    summary: str(it?.판시사항 ?? "")
  };
}

function mapForm(it: any): FormItem {
  return {
    formId: str(it?.별표키 ?? it?.별표일련번호 ?? ""),
    formName: str(it?.별표명 ?? ""),
    formType: str(it?.별표종류 ?? it?.별표구분 ?? ""),
    lawName: str(it?.법령명 ?? it?.법령명한글 ?? ""),
    mst: str(it?.법령일련번호 ?? it?.법령MST ?? "")
  };
}

// ---------- 검색 ----------

export async function searchLaw(q: string, limit = 5): Promise<LawSearchItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing (LAW_OC/LAW_PROXY_TOKEN) — returning []");
    return [];
  }
  const key = `law:searchLaw:${JSON.stringify({ q, limit })}`;
  return withCache<LawSearchItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "law",
        query: q,
        display: limit,
        page: 1
      });
      const payload = raw?.LawSearch ?? raw?.lawSearch ?? {};
      const list = toArray<any>(payload?.law ?? raw?.law ?? []);
      return list.map(mapLaw);
    } catch (err) {
      logger.warn("law-api searchLaw failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchEffectiveLaw(
  q: string,
  limit = 5
): Promise<LawSearchItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchEffectiveLaw:${JSON.stringify({ q, limit })}`;
  return withCache<LawSearchItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "eflaw",
        query: q,
        display: limit,
        page: 1
      });
      const payload = raw?.EflawSearch ?? raw?.LawSearch ?? raw?.eflawSearch ?? {};
      const list = toArray<any>(payload?.law ?? raw?.law ?? []);
      return list.map((it) => ({
        ...mapLaw(it),
        name: str(it?.법령명 ?? it?.법령명한글 ?? "")
      }));
    } catch (err) {
      logger.warn("law-api searchEffectiveLaw failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchPrecedent(
  q: string,
  limit = 5
): Promise<PrecedentSearchItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchPrecedent:${JSON.stringify({ q, limit })}`;
  return withCache<PrecedentSearchItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "prec",
        query: q,
        display: limit,
        page: 1,
        search: 2,
        sort: 1
      });
      const payload = raw?.PrecSearch ?? raw?.LawSearch ?? raw?.precSearch ?? {};
      const list = toArray<any>(payload?.prec ?? raw?.prec ?? []);
      return list.map(mapPrec);
    } catch (err) {
      logger.warn("law-api searchPrecedent failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchInterpretation(
  q: string,
  limit = 5
): Promise<InterpretationItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchInterpretation:${JSON.stringify({ q, limit })}`;
  return withCache<InterpretationItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "expc",
        query: q,
        display: limit,
        page: 1
      });
      const payload = raw?.ExpcSearch ?? raw?.expcSearch ?? {};
      const list = toArray<any>(payload?.expc ?? raw?.expc ?? []);
      return list.map((it) => ({
        interpId: str(it?.법령해석례일련번호 ?? it?.안건번호 ?? ""),
        title: str(it?.안건명 ?? ""),
        agency: str(it?.회신기관명 ?? ""),
        date: str(it?.회신일자 ?? ""),
        summary: str(it?.질의요지 ?? "")
      }));
    } catch (err) {
      logger.warn("law-api searchInterpretation failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchAdminJudgment(
  q: string,
  limit = 5
): Promise<AdminJudgmentItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchAdminJudgment:${JSON.stringify({ q, limit })}`;
  return withCache<AdminJudgmentItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "decc",
        query: q,
        display: limit,
        page: 1,
        search: 2,
        sort: 1
      });
      const payload = raw?.DeccSearch ?? raw?.deccSearch ?? {};
      const list = toArray<any>(payload?.decc ?? raw?.decc ?? []);
      return list.map((it) => ({
        deccId: str(it?.재결례일련번호 ?? ""),
        caseName: str(it?.사건명 ?? ""),
        caseNumber: str(it?.사건번호 ?? ""),
        agency: str(it?.처분청 ?? ""),
        date: str(it?.의결일자 ?? "")
      }));
    } catch (err) {
      logger.warn("law-api searchAdminJudgment failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchAdminRule(
  q: string,
  limit = 5
): Promise<AdminRuleItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchAdminRule:${JSON.stringify({ q, limit })}`;
  return withCache<AdminRuleItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "admrul",
        query: q,
        display: limit,
        page: 1
      });
      const payload = raw?.AdmRulSearch ?? raw?.admRulSearch ?? {};
      const list = toArray<any>(payload?.admrul ?? raw?.admrul ?? []);
      return list.map((it) => ({
        ruleId: str(it?.행정규칙일련번호 ?? ""),
        name: str(it?.행정규칙명 ?? ""),
        agency: str(it?.소관부처명 ?? ""),
        date: str(it?.발령일자 ?? ""),
        ruleType: str(it?.행정규칙종류 ?? "")
      }));
    } catch (err) {
      logger.warn("law-api searchAdminRule failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchOrdinance(
  q: string,
  limit = 5
): Promise<OrdinanceItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchOrdinance:${JSON.stringify({ q, limit })}`;
  return withCache<OrdinanceItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "ordin",
        query: q,
        display: limit,
        page: 1,
        search: 2,
        sort: 1
      });
      const payload = raw?.OrdinSearch ?? raw?.LawSearch ?? raw?.ordinSearch ?? {};
      const list = toArray<any>(payload?.ordin ?? raw?.ordin ?? []);
      return list.map((it) => ({
        ordinanceId: str(it?.자치법규일련번호 ?? it?.자치법규ID ?? ""),
        name: str(it?.자치법규명 ?? ""),
        region: str(it?.지자체기관명 ?? ""),
        date: str(it?.시행일자 ?? "")
      }));
    } catch (err) {
      logger.warn("law-api searchOrdinance failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchForm(q: string, limit = 5): Promise<FormItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchForm:${JSON.stringify({ q, limit })}`;
  return withCache<FormItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "licbyl",
        query: q,
        display: limit,
        page: 1,
        sort: 1
      });
      const payload = raw?.licBylSearch ?? raw?.LicBylSearch ?? {};
      const list = toArray<any>(payload?.licbyl ?? raw?.licbyl ?? []);
      return list.map(mapForm);
    } catch (err) {
      logger.warn("law-api searchForm failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchAdminRuleForm(
  q: string,
  limit = 5
): Promise<FormItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchAdminRuleForm:${JSON.stringify({ q, limit })}`;
  return withCache<FormItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "admbyl",
        query: q,
        display: limit,
        page: 1,
        sort: 1
      });
      const payload = raw?.admRulBylSearch ?? raw?.AdmRulBylSearch ?? {};
      const list = toArray<any>(payload?.admrulbyl ?? raw?.admrulbyl ?? []);
      return list.map(mapForm);
    } catch (err) {
      logger.warn("law-api searchAdminRuleForm failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchOrdinanceForm(
  q: string,
  limit = 5
): Promise<FormItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchOrdinanceForm:${JSON.stringify({ q, limit })}`;
  return withCache<FormItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "ordinbyl",
        query: q,
        display: limit,
        page: 1,
        sort: 1
      });
      const payload = raw?.licBylSearch ?? raw?.LicBylSearch ?? {};
      const list = toArray<any>(payload?.ordinbyl ?? raw?.ordinbyl ?? []);
      return list.map(mapForm);
    } catch (err) {
      logger.warn("law-api searchOrdinanceForm failed", { q, err: String(err) });
      return [];
    }
  });
}

export async function searchMinistryInterpretation(
  ministry: MinistryKey,
  q: string,
  limit = 5
): Promise<MinistryInterpItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchMinistryInterpretation:${JSON.stringify({
    ministry,
    q,
    limit
  })}`;
  return withCache<MinistryInterpItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: MINISTRY_TARGETS[ministry].target,
        query: q,
        display: limit,
        page: 1
      });
      const payload = raw?.CgmExpc ?? raw?.cgmExpc ?? {};
      const list = toArray<any>(payload?.cgmExpc ?? raw?.cgmExpc ?? []);
      return list.map((it) => ({
        interpId: str(it?.안건번호 ?? ""),
        title: str(it?.안건명 ?? ""),
        agency: str(it?.회신기관명 ?? it?.소관부처 ?? ""),
        date: str(it?.회신일자 ?? ""),
        question: str(it?.질의요지 ?? "")
      }));
    } catch (err) {
      logger.warn("law-api searchMinistryInterpretation failed", {
        ministry,
        q,
        err: String(err)
      });
      return [];
    }
  });
}

export async function searchTreaty(q: string, limit = 5): Promise<TreatyItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:searchTreaty:${JSON.stringify({ q, limit })}`;
  return withCache<TreatyItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "trty",
        query: q,
        display: limit,
        page: 1
      });
      const payload = raw?.TrtySearch ?? raw?.trtySearch ?? {};
      const list = toArray<any>(payload?.Trty ?? payload?.trty ?? raw?.Trty ?? []);
      return list.map((it) => ({
        treatyId: str(it?.조약일련번호 ?? ""),
        name: str(it?.조약명 ?? ""),
        counterpart: str(it?.체결대상국 ?? it?.상대국 ?? ""),
        date: str(it?.발효일자 ?? "")
      }));
    } catch (err) {
      logger.warn("law-api searchTreaty failed", { q, err: String(err) });
      return [];
    }
  });
}

// ---------- 상세 ----------

export async function getLawDetail(mst: string): Promise<any | null> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning null");
    return null;
  }
  const key = `law:getLawDetail:${JSON.stringify({ mst })}`;
  return withCache<any | null>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawService.do", { target: "law", MST: mst });
      return raw?.법령 ?? raw?.Law ?? raw ?? null;
    } catch (err) {
      logger.warn("law-api getLawDetail failed", { mst, err: String(err) });
      return null;
    }
  });
}

export async function getPrecedentDetail(id: string): Promise<any | null> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning null");
    return null;
  }
  const key = `law:getPrecedentDetail:${JSON.stringify({ id })}`;
  return withCache<any | null>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawService.do", { target: "prec", ID: id });
      return raw?.PrecService ?? raw?.precService ?? raw ?? null;
    } catch (err) {
      logger.warn("law-api getPrecedentDetail failed", { id, err: String(err) });
      return null;
    }
  });
}

export async function getInterpretationDetail(id: string): Promise<any | null> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning null");
    return null;
  }
  const key = `law:getInterpretationDetail:${JSON.stringify({ id })}`;
  return withCache<any | null>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawService.do", { target: "expc", ID: id });
      return raw?.ExpcService ?? raw?.expcService ?? raw ?? null;
    } catch (err) {
      logger.warn("law-api getInterpretationDetail failed", {
        id,
        err: String(err)
      });
      return null;
    }
  });
}

export async function getAdminJudgmentDetail(id: string): Promise<any | null> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning null");
    return null;
  }
  const key = `law:getAdminJudgmentDetail:${JSON.stringify({ id })}`;
  return withCache<any | null>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawService.do", { target: "decc", ID: id });
      return raw?.DeccService ?? raw?.deccService ?? raw ?? null;
    } catch (err) {
      logger.warn("law-api getAdminJudgmentDetail failed", {
        id,
        err: String(err)
      });
      return null;
    }
  });
}

export async function getAdminRuleDetail(id: string): Promise<any | null> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning null");
    return null;
  }
  const key = `law:getAdminRuleDetail:${JSON.stringify({ id })}`;
  return withCache<any | null>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawService.do", { target: "admrul", ID: id });
      return raw?.AdmRulService ?? raw?.admRulService ?? raw ?? null;
    } catch (err) {
      logger.warn("law-api getAdminRuleDetail failed", { id, err: String(err) });
      return null;
    }
  });
}

export async function getMinistryInterpretationDetail(
  ministry: MinistryKey,
  id: string
): Promise<any | null> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning null");
    return null;
  }
  const key = `law:getMinistryInterpretationDetail:${JSON.stringify({
    ministry,
    id
  })}`;
  return withCache<any | null>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawService.do", {
        target: MINISTRY_TARGETS[ministry].target,
        ID: id
      });
      return raw?.CgmExpcService ?? raw?.cgmExpcService ?? raw ?? null;
    } catch (err) {
      logger.warn("law-api getMinistryInterpretationDetail failed", {
        ministry,
        id,
        err: String(err)
      });
      return null;
    }
  });
}

// ---------- 별표서식 파일 링크 ----------

export type LawFormFile = {
  formNo: string; // 별표번호
  formType: string; // 별표구분 (별표/서식/별지)
  title: string; // 별표제목
  hwpUrl: string; // 별표서식파일링크 → 절대 URL
  pdfUrl: string; // 별표서식PDF파일링크 → 절대 URL
};

export async function getLawFormFiles(mst: string): Promise<LawFormFile[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const key = `law:getLawFormFiles:${JSON.stringify({ mst })}`;
  return withCache<LawFormFile[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const xml = await callDrfXml("lawService.do", { target: "law", MST: mst });
      if (!xml || xml.includes("미신청") || xml.includes("미등록")) return [];
      const blocks = [
        ...xml.matchAll(/<별표단위[^>]*>([\s\S]*?)<\/별표단위>/g)
      ].map((m) => m[1]);
      const out: LawFormFile[] = [];
      for (const block of blocks) {
        const hwpPath = xmlTag(block, "별표서식파일링크");
        const pdfPath = xmlTag(block, "별표서식PDF파일링크");
        if (!hwpPath && !pdfPath) continue;
        out.push({
          formNo: xmlTag(block, "별표번호"),
          formType: xmlTag(block, "별표구분"),
          title: xmlTag(block, "별표제목"),
          hwpUrl: toAbsoluteUrl(hwpPath),
          pdfUrl: toAbsoluteUrl(pdfPath)
        });
      }
      return out;
    } catch (err) {
      logger.warn("law-api getLawFormFiles failed", { mst, err: String(err) });
      return [];
    }
  });
}

// ---------- 조문 ----------

/** "제7조" → "000700", "제7조의2" → "000702" */
export function articleToJo(articleText: string): string {
  const raw = (articleText || "").replace(/\s+/g, "");
  const m = raw.match(/제?(\d+)조(?:의(\d+))?$/);
  if (!m) throw new Error("조문 형식이 올바르지 않습니다. 예: 제750조, 제10조의2");
  const articleNo = parseInt(m[1], 10);
  const branchNo = parseInt(m[2] || "0", 10);
  return `${String(articleNo).padStart(4, "0")}${String(branchNo).padStart(2, "0")}`;
}

export type LawArticle = { article: string; title: string; content: string };

export async function getLawArticleByJo(
  mst: string,
  article: string
): Promise<LawArticle | null> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning null");
    return null;
  }
  const key = `law:getLawArticleByJo:${JSON.stringify({ mst, article })}`;
  return withCache<LawArticle | null>(key, CACHE_TTL_DAY, async () => {
    try {
      const jo = articleToJo(article);
      const xml = await callDrfXml("lawService.do", {
        target: "law",
        MST: mst,
        JO: jo
      });
      if (!xml) return null;
      const contents = xmlBlocks(xml, "조문내용").map((c) =>
        c.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim()
      );
      const titles = xmlBlocks(xml, "조문제목").map((t) =>
        t.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim()
      );
      const body = contents.filter(Boolean).join("\n");
      if (!body) return null;
      return { article, title: titles[0] || "", content: body };
    } catch (err) {
      logger.warn("law-api getLawArticleByJo failed", {
        mst,
        article,
        err: String(err)
      });
      return null;
    }
  });
}
