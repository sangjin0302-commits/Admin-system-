/**
 * 국가법령정보센터(법제처) DRF API 클라이언트 — 레지스트리 기반.
 *
 * DRF는 엔드포인트가 lawSearch.do / lawService.do 2개뿐이며,
 * target 파라미터로 도메인을 구분한다. wrapper key / item key는 target마다 다르다.
 * Vercel IP 화이트리스트 불가 → Lightsail 프록시(3.36.175.81:8080) 경유.
 *
 * TARGET_REGISTRY는 총 60개 target으로, supported: true 항목(51개)은
 * OC=sangjin_api로 실제 호출해 확인한 실측값이다(그 중 verified: false 2개는
 * 프로브 질의 결과가 0건이라 필드명을 형제 target 기준으로 추정했다).
 * supported: false 항목(9개)은 현재 LAW_OC 계정에 target별 조회 권한이 없어 빈 응답만 오며,
 * 스펙은 production bot(_lib.py) 기준 추정값이다. 호출 없이 즉시 []/null을 반환한다.
 *
 * 헌재결정례: ccourt는 조회 권한 없음(supported: false). 실제 동작하는 target은 detc이다.
 *
 * 주의: 검색 응답에는 본문/요지(판시사항·질의요지 등)가 없다. 요지는 상세 호출로만 얻는다.
 * 예외: aiSearch는 검색 응답에 조문내용(본문)을 포함하는 유일한 target이다.
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

// ---------- 일반 헬퍼 ----------

/** 별표명 등에 섞여 오는 HTML(<strong> 등) 제거 */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function firstField(it: any, fields: string[]): string {
  for (const f of fields) {
    const v = it?.[f];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function pickWrapper(raw: any, wrappers: string[]): any {
  for (const w of wrappers) if (raw?.[w]) return raw[w];
  return raw ?? {};
}

function pickItems(payload: any, raw: any, itemKeys: string[]): any[] {
  for (const k of itemKeys) {
    if (payload?.[k]) return toArray<any>(payload[k]);
    if (raw?.[k]) return toArray<any>(raw[k]);
  }
  return [];
}

// ---------- 레지스트리 ----------

export type TargetKey =
  | "law" | "eflaw" | "elaw"
  | "prec" | "ccourt"
  | "expc" | "decc"
  | "molitCgmExpc" | "moelCgmExpc" | "ntsCgmExpc"
  | "mojCgmExpc" | "mofCgmExpc" | "mssCgmExpc" | "kcsCgmExpc" | "mpvaCgmExpc"
  | "mowCgmExpc"
  | "ttSpecialDecc" | "kmstSpecialDecc" | "acrSpecialDecc" | "adapSpecialDecc"
  | "detc"
  | "lstrm" | "lstrmAI" | "dlytrm"
  | "thdCmp" | "oldAndNew" | "admrulOldAndNew"
  | "lsRlt" | "lnkLs" | "lnkOrd" | "lsStmd" | "oneview"
  | "nhrck"
  | "admrul" | "ordin" | "trty"
  | "school" | "public" | "pi"
  | "aiSearch" | "aiRltLs"
  | "licbyl" | "admbyl" | "ordinbyl"
  | "nodong" | "audit" | "acrc" | "empins"
  | "ftc" | "fsc" | "ppc" | "bill"
  | "kcc" | "sfc" | "eiac" | "oclt" | "iaciac" | "ecc"
  | "lstrmRlt" | "dlytrmRlt";

export type TargetSpec = {
  key: TargetKey;
  label: string;
  group: "법령" | "판례·심판" | "해석" | "서식" | "위원회" | "기타";
  wrappers: string[];
  itemKeys: string[];
  idFields: string[];
  titleFields: string[];
  agencyFields?: string[];
  dateFields?: string[];
  numberFields?: string[];
  linkFields?: string[];
  detailIdParam: "ID" | "MST";
  searchParams?: Record<string, string | number>;
  hasFiles?: boolean;
  /** 라이브 응답으로 wrapper/itemKey/필드명을 실측 검증했는지 */
  verified: boolean;
  /**
   * 현재 LAW_OC 계정으로 조회 가능한지.
   * false = 법제처가 빈 응답 반환 (target별 별도 신청 필요).
   * 조회는 시도하지 않고 즉시 [] 반환한다.
   */
  supported: boolean;
};

export const TARGET_REGISTRY: Record<TargetKey, TargetSpec> = {
  // ===== 실측 검증 =====
  law: {
    key: "law",
    label: "현행법령",
    group: "법령",
    wrappers: ["LawSearch"],
    itemKeys: ["law"],
    idFields: ["법령일련번호"],
    titleFields: ["법령명한글", "법령약칭명"],
    agencyFields: ["소관부처명"],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["공포번호"],
    linkFields: ["법령상세링크"],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },
  prec: {
    key: "prec",
    label: "판례",
    group: "판례·심판",
    wrappers: ["PrecSearch"],
    itemKeys: ["prec"],
    idFields: ["판례일련번호"],
    titleFields: ["사건명"],
    agencyFields: ["법원명"],
    dateFields: ["선고일자"],
    numberFields: ["사건번호"],
    linkFields: ["판례상세링크"],
    detailIdParam: "ID",
    searchParams: { search: 2, sort: 1 },
    verified: true,
    supported: true
  },
  expc: {
    key: "expc",
    label: "법령해석례",
    group: "해석",
    wrappers: ["Expc"],
    itemKeys: ["expc"],
    idFields: ["법령해석례일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["회신기관명", "질의기관명"],
    dateFields: ["회신일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석례상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  decc: {
    key: "decc",
    label: "행정심판재결례",
    group: "판례·심판",
    wrappers: ["Decc"],
    itemKeys: ["decc"],
    idFields: ["행정심판재결례일련번호"],
    titleFields: ["사건명"],
    agencyFields: ["재결청", "처분청"],
    dateFields: ["의결일자", "처분일자"],
    numberFields: ["사건번호"],
    linkFields: ["행정심판례상세링크"],
    detailIdParam: "ID",
    searchParams: { search: 2, sort: 1 },
    verified: true,
    supported: true
  },
  admrul: {
    key: "admrul",
    label: "행정규칙",
    group: "법령",
    wrappers: ["AdmRulSearch"],
    itemKeys: ["admrul"],
    idFields: ["행정규칙일련번호"],
    titleFields: ["행정규칙명"],
    agencyFields: ["소관부처명"],
    dateFields: ["발령일자", "시행일자"],
    numberFields: ["발령번호"],
    linkFields: ["행정규칙상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  ordin: {
    key: "ordin",
    label: "자치법규",
    group: "법령",
    // itemKey는 "ordin"이 아니라 "law" (실측 확인됨)
    wrappers: ["OrdinSearch"],
    itemKeys: ["law"],
    idFields: ["자치법규일련번호"],
    titleFields: ["자치법규명"],
    agencyFields: ["지자체기관명"],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["자치법규ID"],
    linkFields: ["자치법규상세링크"],
    detailIdParam: "MST",
    searchParams: { search: 2, sort: 1 },
    verified: true,
    supported: true
  },
  trty: {
    key: "trty",
    label: "조약",
    group: "법령",
    wrappers: ["TrtySearch"],
    itemKeys: ["Trty"],
    idFields: ["조약일련번호"],
    titleFields: ["조약명"],
    agencyFields: ["조약구분명"],
    dateFields: ["발효일자", "서명일자"],
    numberFields: ["조약번호"],
    linkFields: ["조약상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  licbyl: {
    key: "licbyl",
    label: "법령 별표·서식",
    group: "서식",
    wrappers: ["licBylSearch"],
    itemKeys: ["licbyl"],
    idFields: ["별표일련번호"],
    titleFields: ["별표명"],
    agencyFields: ["소관부처명"],
    dateFields: [],
    numberFields: ["별표번호"],
    linkFields: ["별표법령상세링크"],
    detailIdParam: "ID",
    searchParams: { sort: 1 },
    hasFiles: true,
    verified: true,
    supported: true
  },
  admbyl: {
    key: "admbyl",
    label: "행정규칙 별표·서식",
    group: "서식",
    // PDF 링크 필드 없음 (HWP만)
    wrappers: ["admRulBylSearch"],
    itemKeys: ["admrulbyl"],
    idFields: ["별표일련번호"],
    titleFields: ["별표명"],
    agencyFields: ["소관부처명"],
    dateFields: ["발령일자"],
    numberFields: ["별표번호", "발령번호"],
    linkFields: ["별표행정규칙상세링크"],
    detailIdParam: "ID",
    searchParams: { sort: 1 },
    hasFiles: true,
    verified: true,
    supported: true
  },
  ordinbyl: {
    key: "ordinbyl",
    label: "자치법규 별표·서식",
    group: "서식",
    // wrapper는 licbyl과 동일한 licBylSearch, PDF 링크 없음
    wrappers: ["licBylSearch"],
    itemKeys: ["ordinbyl"],
    idFields: ["별표일련번호"],
    titleFields: ["별표명"],
    agencyFields: ["지자체기관명", "전체기관명"],
    dateFields: ["자치법규시행일자", "공포일자"],
    numberFields: ["별표번호", "공포번호"],
    linkFields: ["별표자치법규상세링크"],
    detailIdParam: "ID",
    searchParams: { sort: 1 },
    hasFiles: true,
    verified: true,
    supported: true
  },
  molitCgmExpc: {
    key: "molitCgmExpc",
    label: "국토교통부 유권해석",
    group: "해석",
    wrappers: ["CgmExpc"],
    itemKeys: ["cgmExpc"],
    idFields: ["법령해석일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["해석기관명", "질의기관명"],
    dateFields: ["해석일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  moelCgmExpc: {
    key: "moelCgmExpc",
    label: "고용노동부 유권해석",
    group: "해석",
    wrappers: ["CgmExpc"],
    itemKeys: ["cgmExpc"],
    idFields: ["법령해석일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["해석기관명", "질의기관명"],
    dateFields: ["해석일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  ntsCgmExpc: {
    key: "ntsCgmExpc",
    label: "국세청 유권해석",
    group: "해석",
    wrappers: ["CgmExpc"],
    itemKeys: ["cgmExpc"],
    idFields: ["법령해석일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["해석기관명", "질의기관명"],
    dateFields: ["해석일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  // moj/mof는 CgmExpc wrapper를 반환했으나 프로브 질의 결과 item 0건.
  // target 자체는 유효하며 shape는 다른 CgmExpc target과 동일함을 확인.
  mojCgmExpc: {
    key: "mojCgmExpc",
    label: "법무부 유권해석",
    group: "해석",
    wrappers: ["CgmExpc"],
    itemKeys: ["cgmExpc"],
    idFields: ["법령해석일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["해석기관명", "질의기관명"],
    dateFields: ["해석일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  mofCgmExpc: {
    key: "mofCgmExpc",
    label: "기획재정부 유권해석",
    group: "해석",
    wrappers: ["CgmExpc"],
    itemKeys: ["cgmExpc"],
    idFields: ["법령해석일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["해석기관명", "질의기관명"],
    dateFields: ["해석일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  mssCgmExpc: {
    key: "mssCgmExpc",
    label: "중소벤처기업부 유권해석",
    group: "해석",
    wrappers: ["CgmExpc"],
    itemKeys: ["cgmExpc"],
    idFields: ["법령해석일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["해석기관명", "질의기관명"],
    dateFields: ["해석일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  kcsCgmExpc: {
    key: "kcsCgmExpc",
    label: "관세청 유권해석",
    group: "해석",
    wrappers: ["CgmExpc"],
    itemKeys: ["cgmExpc"],
    idFields: ["법령해석일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["해석기관명", "질의기관명"],
    dateFields: ["해석일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  mpvaCgmExpc: {
    key: "mpvaCgmExpc",
    label: "국가보훈부 유권해석",
    group: "해석",
    wrappers: ["CgmExpc"],
    itemKeys: ["cgmExpc"],
    idFields: ["법령해석일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["해석기관명", "질의기관명"],
    dateFields: ["해석일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },

  // ===== 특별행정심판 =====
  ttSpecialDecc: {
    key: "ttSpecialDecc",
    label: "조세심판원 재결례",
    group: "판례·심판",
    wrappers: ["Decc"],
    itemKeys: ["decc"],
    idFields: ["특별행정심판재결례일련번호"],
    titleFields: ["사건명"],
    agencyFields: ["재결청", "처분청"],
    dateFields: ["의결일자", "처분일자"],
    numberFields: ["청구번호"],
    linkFields: ["행정심판재결례상세링크"],
    detailIdParam: "ID",
    searchParams: { search: 2, sort: 1 },
    verified: true,
    supported: true
  },
  kmstSpecialDecc: {
    key: "kmstSpecialDecc",
    label: "해양안전심판원 재결례",
    group: "판례·심판",
    wrappers: ["Decc"],
    itemKeys: ["decc"],
    idFields: ["특별행정심판재결례일련번호"],
    titleFields: ["사건명"],
    agencyFields: ["재결청", "처분청"],
    dateFields: ["의결일자", "처분일자"],
    numberFields: ["재결번호"],
    linkFields: ["행정심판재결례상세링크"],
    detailIdParam: "ID",
    searchParams: { search: 2, sort: 1 },
    verified: true,
    supported: true
  },
  // 프로브 질의에서 Decc wrapper는 반환됐으나 item 0건 — target 유효, shape는 형제 target과 동일 가정.
  acrSpecialDecc: {
    key: "acrSpecialDecc",
    label: "국민권익위 특별행정심판",
    group: "판례·심판",
    wrappers: ["Decc"],
    itemKeys: ["decc"],
    idFields: ["특별행정심판재결례일련번호"],
    titleFields: ["사건명"],
    agencyFields: ["재결청", "처분청"],
    dateFields: ["의결일자", "처분일자"],
    numberFields: ["사건번호"],
    linkFields: ["행정심판재결례상세링크"],
    detailIdParam: "ID",
    searchParams: { search: 2, sort: 1 },
    verified: true,
    supported: true
  },
  adapSpecialDecc: {
    key: "adapSpecialDecc",
    label: "소청심사 재결례",
    group: "판례·심판",
    wrappers: ["Decc"],
    itemKeys: ["decc"],
    idFields: ["특별행정심판재결례일련번호"],
    titleFields: ["사건명"],
    agencyFields: ["재결청", "처분청"],
    dateFields: ["의결일자", "처분일자"],
    numberFields: ["사건번호"],
    linkFields: ["행정심판재결례상세링크"],
    detailIdParam: "ID",
    searchParams: { search: 2, sort: 1 },
    verified: true,
    supported: true
  },

  // 헌재결정례의 실동작 target (ccourt는 권한 없음)
  detc: {
    key: "detc",
    label: "헌재결정례",
    group: "판례·심판",
    wrappers: ["DetcSearch"],
    itemKeys: ["Detc"],
    idFields: ["헌재결정례일련번호"],
    titleFields: ["사건명"],
    agencyFields: [],
    dateFields: ["종국일자"],
    numberFields: ["사건번호"],
    linkFields: ["헌재결정례상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },

  // ===== 법령용어 =====
  lstrm: {
    key: "lstrm",
    label: "법령용어",
    group: "기타",
    wrappers: ["LsTrmSearch"],
    itemKeys: ["lstrm"],
    idFields: ["법령용어ID"],
    titleFields: ["법령용어명"],
    agencyFields: [],
    dateFields: [],
    numberFields: [],
    linkFields: ["법령용어상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  lstrmAI: {
    key: "lstrmAI",
    label: "법령용어(AI 연계)",
    group: "기타",
    // itemKey가 한글("법령용어")
    wrappers: ["lstrmAISearch"],
    itemKeys: ["법령용어"],
    idFields: ["id"],
    titleFields: ["법령용어명"],
    agencyFields: [],
    dateFields: [],
    numberFields: [],
    linkFields: ["용어간관계링크", "조문간관계링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  dlytrm: {
    key: "dlytrm",
    label: "일상용어",
    group: "기타",
    // itemKey가 한글("일상용어")
    wrappers: ["dlytrmSearch"],
    itemKeys: ["일상용어"],
    idFields: ["id"],
    titleFields: ["일상용어명"],
    agencyFields: ["출처"],
    dateFields: [],
    numberFields: [],
    linkFields: ["용어간관계링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },

  // ===== 비교 도구 =====
  thdCmp: {
    key: "thdCmp",
    label: "3단 비교(법률-시행령-시행규칙)",
    group: "법령",
    wrappers: ["thdCmpLawSearch"],
    itemKeys: ["thdCmp"],
    idFields: ["삼단비교일련번호"],
    titleFields: ["법령명한글"],
    agencyFields: ["소관부처명"],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["공포번호"],
    linkFields: ["위임조문_삼단비교상세링크", "인용조문_삼단비교상세링크"],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },
  oldAndNew: {
    key: "oldAndNew",
    label: "신구조문 대조표",
    group: "법령",
    wrappers: ["OldAndNewLawSearch"],
    itemKeys: ["oldAndNew"],
    idFields: ["신구법일련번호"],
    titleFields: ["신구법명"],
    agencyFields: ["소관부처명"],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["공포번호"],
    linkFields: ["신구법상세링크"],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },
  admrulOldAndNew: {
    key: "admrulOldAndNew",
    label: "행정규칙 신구조문 대조표",
    group: "법령",
    wrappers: ["OldAndNewLawSearch"],
    itemKeys: ["oldAndNew"],
    idFields: ["신구법일련번호"],
    titleFields: ["신구법명"],
    agencyFields: ["소관부처명"],
    dateFields: ["발령일자", "시행일자"],
    numberFields: ["발령번호"],
    linkFields: ["신구법상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },

  // ===== 연계·체계 =====
  lsRlt: {
    key: "lsRlt",
    label: "관련법령 연계",
    group: "법령",
    // itemKey가 한글("법령")
    wrappers: ["lsRltSearch"],
    itemKeys: ["법령"],
    idFields: ["기준법령ID"],
    titleFields: ["기준법령명"],
    agencyFields: [],
    dateFields: [],
    numberFields: [],
    linkFields: ["기준법령본문조회"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  lnkLs: {
    key: "lnkLs",
    label: "연계 법령",
    group: "법령",
    wrappers: ["LawSearch"],
    itemKeys: ["law"],
    idFields: ["법령일련번호"],
    titleFields: ["법령명한글"],
    agencyFields: [],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["공포번호"],
    linkFields: [],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },
  lnkOrd: {
    key: "lnkOrd",
    label: "연계 자치법규",
    group: "법령",
    wrappers: ["OrdinSearch"],
    itemKeys: ["law"],
    idFields: ["자치법규일련번호"],
    titleFields: ["자치법규명"],
    agencyFields: [],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["공포번호"],
    linkFields: [],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },
  lsStmd: {
    key: "lsStmd",
    label: "법령체계도",
    group: "법령",
    wrappers: ["LsStmdSearch"],
    itemKeys: ["law"],
    idFields: ["법령일련번호"],
    titleFields: ["법령명"],
    agencyFields: ["소관부처명"],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["공포번호"],
    linkFields: ["본문상세링크"],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },
  oneview: {
    key: "oneview",
    label: "법령 통합조회",
    group: "법령",
    wrappers: ["items"],
    itemKeys: ["item"],
    idFields: ["법령일련번호"],
    titleFields: ["법령명"],
    agencyFields: [],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["공포번호"],
    linkFields: [],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },

  nhrck: {
    key: "nhrck",
    label: "국가인권위 결정례",
    group: "위원회",
    wrappers: ["Nhrck"],
    itemKeys: ["nhrck"],
    idFields: ["결정문일련번호"],
    titleFields: ["사건명"],
    agencyFields: ["위원회명"],
    dateFields: ["의결일자"],
    numberFields: ["사건번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },

  eflaw: {
    key: "eflaw",
    label: "시행일법령",
    group: "법령",
    // 실측: wrapper는 LawSearch로 반환됨 (EflawSearch 아님)
    wrappers: ["LawSearch", "EflawSearch"],
    itemKeys: ["law"],
    idFields: ["법령일련번호"],
    titleFields: ["법령명한글"],
    agencyFields: ["소관부처명"],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["공포번호"],
    linkFields: ["법령상세링크"],
    detailIdParam: "MST",
    searchParams: { search: 1, sort: 1 },
    verified: true,
    supported: true
  },
  elaw: {
    key: "elaw",
    label: "영문법령",
    group: "법령",
    wrappers: ["LawSearch"],
    itemKeys: ["law"],
    idFields: ["법령일련번호"],
    titleFields: ["법령명영문", "법령명한글"],
    agencyFields: ["소관부처명"],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["공포번호"],
    linkFields: ["법령상세링크"],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },
  ftc: {
    key: "ftc",
    label: "공정거래위 결정례",
    group: "위원회",
    wrappers: ["Ftc"],
    itemKeys: ["ftc"],
    idFields: ["결정문일련번호"],
    titleFields: ["사건명"],
    agencyFields: ["회의종류"],
    dateFields: ["결정일자"],
    numberFields: ["사건번호", "결정번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  fsc: {
    key: "fsc",
    label: "금융위 결정례",
    group: "위원회",
    // 실측: 날짜 필드가 응답에 없음
    wrappers: ["Fsc"],
    itemKeys: ["fsc"],
    idFields: ["결정문일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["기관명"],
    dateFields: [],
    numberFields: ["의결번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  ppc: {
    key: "ppc",
    label: "개인정보위 결정례",
    group: "위원회",
    wrappers: ["Ppc"],
    itemKeys: ["ppc"],
    idFields: ["결정문일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["회의종류"],
    dateFields: ["의결일"],
    numberFields: ["의안번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  kcc: {
    key: "kcc",
    label: "방송통신위원회 결정례",
    group: "위원회",
    wrappers: ["Kcc"],
    itemKeys: ["kcc"],
    idFields: ["결정문일련번호"],
    titleFields: ["안건명"],
    agencyFields: [],
    dateFields: ["의결일자"],
    numberFields: ["안건번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  sfc: {
    key: "sfc",
    label: "증권선물위원회 결정례",
    group: "위원회",
    // 실측: 날짜 필드가 응답에 없음
    wrappers: ["Sfc"],
    itemKeys: ["sfc"],
    idFields: ["결정문일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["기관명"],
    dateFields: [],
    numberFields: ["의결번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  eiac: {
    key: "eiac",
    label: "고용보험심사위원회 결정례",
    group: "위원회",
    wrappers: ["Eiac"],
    itemKeys: ["eiac"],
    idFields: ["결정문일련번호"],
    titleFields: ["사건명"],
    agencyFields: [],
    dateFields: ["의결일자"],
    numberFields: ["사건번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  oclt: {
    key: "oclt",
    label: "중앙토지수용위원회 결정례",
    group: "위원회",
    // 실측: 제목/링크/일련번호만 반환 (기관·날짜·번호 필드 없음)
    wrappers: ["Oclt"],
    itemKeys: ["oclt"],
    idFields: ["결정문일련번호"],
    titleFields: ["제목"],
    agencyFields: [],
    dateFields: [],
    numberFields: [],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  // 프로브 질의 결과 0건 — wrapper는 확인됨, 필드는 형제 위원회 target 기준 추정값.
  iaciac: {
    key: "iaciac",
    label: "산업재해보상보험재심사위원회 결정례",
    group: "위원회",
    wrappers: ["Iaciac"],
    itemKeys: ["iaciac"],
    idFields: ["결정문일련번호"],
    titleFields: ["사건명", "안건명"],
    agencyFields: [],
    dateFields: ["의결일자"],
    numberFields: ["사건번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: false,
    supported: true
  },
  ecc: {
    key: "ecc",
    label: "환경분쟁조정위원회 결정례",
    group: "위원회",
    wrappers: ["Ecc"],
    itemKeys: ["ecc"],
    idFields: ["결정문일련번호"],
    titleFields: ["사건명", "안건명"],
    agencyFields: [],
    dateFields: ["의결일자"],
    numberFields: ["사건번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: false,
    supported: true
  },

  // ===== 행정규칙 유형별 (AdmRulSearch.admrul + 법령분류코드/법령분류명) =====
  school: {
    key: "school",
    label: "학교 행정규칙",
    group: "법령",
    wrappers: ["AdmRulSearch"],
    itemKeys: ["admrul"],
    idFields: ["행정규칙일련번호"],
    titleFields: ["행정규칙명"],
    agencyFields: ["소관부처명"],
    dateFields: ["발령일자", "시행일자"],
    numberFields: ["발령번호"],
    linkFields: ["행정규칙상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  public: {
    key: "public",
    label: "공공기관 행정규칙",
    group: "법령",
    wrappers: ["AdmRulSearch"],
    itemKeys: ["admrul"],
    idFields: ["행정규칙일련번호"],
    titleFields: ["행정규칙명"],
    agencyFields: ["소관부처명"],
    dateFields: ["발령일자", "시행일자"],
    numberFields: ["발령번호"],
    linkFields: ["행정규칙상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  pi: {
    key: "pi",
    label: "개인정보 행정규칙",
    group: "법령",
    wrappers: ["AdmRulSearch"],
    itemKeys: ["admrul"],
    idFields: ["행정규칙일련번호"],
    titleFields: ["행정규칙명"],
    agencyFields: ["소관부처명"],
    dateFields: ["발령일자", "시행일자"],
    numberFields: ["발령번호"],
    linkFields: ["행정규칙상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },

  // ===== AI 조문 검색 =====
  aiSearch: {
    key: "aiSearch",
    label: "AI 조문 검색(본문 포함)",
    group: "법령",
    // itemKey가 한글("법령조문")
    // 실측: 검색 응답에 조문내용(본문)이 포함되는 유일한 target
    wrappers: ["aiSearch"],
    itemKeys: ["법령조문"],
    idFields: ["조문일련번호", "법령일련번호"],
    titleFields: ["조문제목", "법령명"],
    agencyFields: ["소관부처명"],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["조문번호", "공포번호"],
    linkFields: [],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },
  aiRltLs: {
    key: "aiRltLs",
    label: "AI 연관 법령조문",
    group: "법령",
    // itemKey가 한글("법령조문")
    wrappers: ["aiRltLsSearch"],
    itemKeys: ["법령조문"],
    idFields: ["법령ID"],
    titleFields: ["조문제목", "법령명"],
    agencyFields: [],
    dateFields: ["시행일자", "공포일자"],
    numberFields: ["조문번호", "공포번호"],
    linkFields: [],
    detailIdParam: "MST",
    verified: true,
    supported: true
  },

  // ===== 미지원: 현재 LAW_OC 계정에 target별 조회 권한 없음 =====
  // JSON/XML 모두 빈 응답 확인. 법제처에 target별 추가 신청 시 supported: true 로 전환.
  // ccourt는 조회 권한 없음. 헌재결정례는 detc target을 사용할 것 (실측 동작 확인).
  ccourt: {
    key: "ccourt",
    label: "헌재결정례",
    group: "판례·심판",
    wrappers: ["CcourtSearch", "LawSearch"],
    itemKeys: ["ccourt", "prec"],
    idFields: ["헌재결정례일련번호", "판례일련번호"],
    titleFields: ["사건명"],
    agencyFields: ["법원명", "재판기관"],
    dateFields: ["종국일자", "선고일자"],
    numberFields: ["사건번호"],
    linkFields: ["헌재결정례상세링크", "판례상세링크"],
    detailIdParam: "ID",
    verified: false,
    supported: false
  },
  nodong: {
    key: "nodong",
    label: "노동위원회 결정례",
    group: "위원회",
    wrappers: ["NodongSearch", "LawSearch"],
    itemKeys: ["nodong"],
    idFields: ["노동위원회결정문일련번호", "일련번호"],
    titleFields: ["사건명", "안건명", "건명"],
    agencyFields: ["처분청", "회신기관명"],
    dateFields: ["의결일자", "회신일자"],
    numberFields: ["사건번호", "안건번호"],
    linkFields: ["노동위원회결정문상세링크"],
    detailIdParam: "ID",
    verified: false,
    supported: false
  },
  audit: {
    key: "audit",
    label: "감사원 심사결정례",
    group: "위원회",
    wrappers: ["AuditSearch", "LawSearch"],
    itemKeys: ["audit"],
    idFields: ["감사원심사결정일련번호", "일련번호"],
    titleFields: ["처분명", "사건명", "안건명"],
    agencyFields: ["처분청", "회신기관명"],
    dateFields: ["의결일자", "결정일자"],
    numberFields: ["사건번호", "안건번호"],
    linkFields: ["감사원심사결정상세링크"],
    detailIdParam: "ID",
    verified: false,
    supported: false
  },
  acrc: {
    key: "acrc",
    label: "국민권익위 결정례",
    group: "위원회",
    wrappers: ["AcrcSearch", "LawSearch"],
    itemKeys: ["acrc"],
    idFields: ["국민권익위결정문일련번호", "일련번호"],
    titleFields: ["사건명", "안건명"],
    agencyFields: ["처분청", "회신기관명"],
    dateFields: ["의결일자", "회신일자"],
    numberFields: ["사건번호", "안건번호"],
    linkFields: ["국민권익위결정문상세링크"],
    detailIdParam: "ID",
    verified: false,
    supported: false
  },
  empins: {
    key: "empins",
    label: "고용보험 심사결정례",
    group: "위원회",
    wrappers: ["EmpinsSearch", "LawSearch"],
    itemKeys: ["empins"],
    idFields: ["고용보험심사결정일련번호", "일련번호"],
    titleFields: ["사건명", "안건명"],
    agencyFields: ["처분청", "회신기관명"],
    dateFields: ["의결일자", "결정일자"],
    numberFields: ["사건번호", "안건번호"],
    linkFields: ["고용보험심사결정례상세링크"],
    detailIdParam: "ID",
    verified: false,
    supported: false
  },
  bill: {
    key: "bill",
    label: "법령안",
    group: "법령",
    wrappers: ["BillSearch", "LawSearch"],
    itemKeys: ["bill"],
    idFields: ["법령안일련번호", "일련번호"],
    titleFields: ["법령안명", "법안명", "명칭"],
    agencyFields: ["소관부처명"],
    dateFields: ["입법예고일자", "공포일자"],
    numberFields: ["의안번호"],
    linkFields: ["법령안상세링크"],
    detailIdParam: "ID",
    verified: false,
    supported: false
  },
  // 프로브 결과 빈 응답(JSON). shape는 다른 CgmExpc target 기준 추정값.
  mowCgmExpc: {
    key: "mowCgmExpc",
    label: "여성가족부 유권해석",
    group: "해석",
    wrappers: ["CgmExpc"],
    itemKeys: ["cgmExpc"],
    idFields: ["법령해석일련번호"],
    titleFields: ["안건명"],
    agencyFields: ["해석기관명", "질의기관명"],
    dateFields: ["해석일자"],
    numberFields: ["안건번호"],
    linkFields: ["법령해석상세링크"],
    detailIdParam: "ID",
    verified: false,
    supported: false
  },
  // 프로브 결과 빈 응답. shape는 lstrm/dlytrm 기준 추정값.
  lstrmRlt: {
    key: "lstrmRlt",
    label: "법령용어 연계",
    group: "기타",
    wrappers: ["lstrmRltSearch"],
    itemKeys: ["법령용어"],
    idFields: ["법령용어ID", "id"],
    titleFields: ["법령용어명"],
    agencyFields: [],
    dateFields: [],
    numberFields: [],
    linkFields: ["용어간관계링크", "조문간관계링크"],
    detailIdParam: "ID",
    verified: false,
    supported: false
  },
  dlytrmRlt: {
    key: "dlytrmRlt",
    label: "일상용어 연계",
    group: "기타",
    wrappers: ["dlytrmRltSearch"],
    itemKeys: ["일상용어"],
    idFields: ["일상용어ID", "id"],
    titleFields: ["일상용어명"],
    agencyFields: ["출처"],
    dateFields: [],
    numberFields: [],
    linkFields: ["용어간관계링크"],
    detailIdParam: "ID",
    verified: false,
    supported: false
  }
};

/** 기본은 조회 가능한 target만. 전체가 필요하면 includeUnsupported: true. */
export function listTargets(opts?: { includeUnsupported?: boolean }): TargetSpec[] {
  const all = Object.values(TARGET_REGISTRY);
  return opts?.includeUnsupported ? all : all.filter((s) => s.supported);
}

/** 그룹별로 묶은 사용 가능한 target 목록 (admin UI 탭 구성용) */
export function listTargetsByGroup(): Record<TargetSpec["group"], TargetSpec[]> {
  const out = {} as Record<TargetSpec["group"], TargetSpec[]>;
  for (const spec of listTargets()) {
    (out[spec.group] ??= []).push(spec);
  }
  return out;
}

export function getTargetSpec(target: TargetKey): TargetSpec | null {
  return TARGET_REGISTRY[target] ?? null;
}

// ---------- 통합 결과 타입 ----------

export type LawResultItem = {
  target: TargetKey;
  id: string;
  title: string;
  agency: string;
  date: string;
  number: string;
  detailUrl: string;
  hwpUrl?: string;
  pdfUrl?: string;
  extra: Record<string, string>;
};

// 구 도메인별 타입 — 통합 타입 별칭으로 유지 (기존 import 호환)
export type LawSearchItem = LawResultItem;
export type PrecedentSearchItem = LawResultItem;
export type InterpretationItem = LawResultItem;
export type AdminJudgmentItem = LawResultItem;
export type AdminRuleItem = LawResultItem;
export type OrdinanceItem = LawResultItem;
export type FormItem = LawResultItem;
export type MinistryInterpItem = LawResultItem;
export type TreatyItem = LawResultItem;

// ---------- 부처별 유권해석 target (back-compat) ----------

export const MINISTRY_TARGETS = {
  molit: { target: "molitCgmExpc", label: "국토교통부" },
  moel: { target: "moelCgmExpc", label: "고용노동부" },
  nts: { target: "ntsCgmExpc", label: "국세청" },
  moj: { target: "mojCgmExpc", label: "법무부" },
  mof: { target: "mofCgmExpc", label: "기획재정부" },
  mss: { target: "mssCgmExpc", label: "중소벤처기업부" },
  kcs: { target: "kcsCgmExpc", label: "관세청" },
  mpva: { target: "mpvaCgmExpc", label: "국가보훈부" }
} as const;
export type MinistryKey = keyof typeof MINISTRY_TARGETS;

// ---------- 특별행정심판 target (back-compat) ----------

export const SPECIAL_DECC_TARGETS = {
  tt: { target: "ttSpecialDecc", label: "조세심판원" },
  kmst: { target: "kmstSpecialDecc", label: "해양안전심판원" },
  acr: { target: "acrSpecialDecc", label: "국민권익위" },
  adap: { target: "adapSpecialDecc", label: "소청심사" }
} as const;
export type SpecialDeccKind = keyof typeof SPECIAL_DECC_TARGETS;

// ---------- 행정규칙 유형별 target ----------

export const ADMRUL_TYPE_TARGETS = {
  school: { target: "school", label: "학교" },
  public: { target: "public", label: "공공기관" },
  pi: { target: "pi", label: "개인정보" }
} as const;
export type AdmRulTypeKey = keyof typeof ADMRUL_TYPE_TARGETS;

// ---------- 매핑 ----------

function mapItem(target: TargetKey, spec: TargetSpec, it: any): LawResultItem {
  const extra: Record<string, string> = {};
  if (it && typeof it === "object") {
    for (const [k, v] of Object.entries(it)) {
      if (v == null) continue;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        extra[k] = String(v);
      }
    }
  }

  const out: LawResultItem = {
    target,
    id: firstField(it, spec.idFields),
    title: stripHtml(firstField(it, spec.titleFields)),
    agency: firstField(it, spec.agencyFields ?? []),
    date: firstField(it, spec.dateFields ?? []),
    number: firstField(it, spec.numberFields ?? []),
    detailUrl: toAbsoluteUrl(firstField(it, spec.linkFields ?? [])),
    extra
  };

  if (spec.hasFiles) {
    const hwp = firstField(it, ["별표서식파일링크"]);
    const pdf = firstField(it, ["별표서식PDF파일링크"]);
    if (hwp) out.hwpUrl = toAbsoluteUrl(hwp);
    if (pdf) out.pdfUrl = toAbsoluteUrl(pdf);
  }

  return out;
}

// ---------- 코어: 검색 ----------

export async function searchTarget(
  target: TargetKey,
  query: string,
  limit = 5
): Promise<LawResultItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing (LAW_OC/LAW_PROXY_TOKEN) — returning []");
    return [];
  }
  const spec = TARGET_REGISTRY[target];
  if (!spec) {
    logger.warn("law-api: unknown target", { target });
    return [];
  }
  if (!spec.supported) {
    logger.warn("law-api: target not permitted for current LAW_OC — returning []", {
      target,
      label: spec.label
    });
    return [];
  }
  const key = `law:searchTarget:${target}:${query}:${limit}`;
  return withCache<LawResultItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target,
        query,
        display: limit,
        page: 1,
        ...(spec.searchParams ?? {})
      });
      const payload = pickWrapper(raw, spec.wrappers);
      const list = pickItems(payload, raw, spec.itemKeys);
      return list
        .map((it) => mapItem(target, spec, it))
        .filter((it) => Boolean(it.title));
    } catch (err) {
      logger.warn("law-api searchTarget failed", {
        target,
        query,
        err: String(err)
      });
      return [];
    }
  });
}

export async function searchMany(
  targets: TargetKey[],
  query: string,
  limitEach = 3
): Promise<Record<string, LawResultItem[]>> {
  const pairs = await Promise.all(
    targets.map(async (t) => {
      try {
        return [t, await searchTarget(t, query, limitEach)] as const;
      } catch (err) {
        logger.warn("law-api searchMany target failed", {
          target: t,
          err: String(err)
        });
        return [t, [] as LawResultItem[]] as const;
      }
    })
  );
  return Object.fromEntries(pairs);
}

// ---------- 코어: 상세 ----------

/**
 * 상세 응답의 wrapper/구조는 target마다 크게 다르고 미검증이므로,
 * 중첩 객체를 재귀 순회하여 문자열/숫자 leaf만 평탄화한다 (최대 depth 3).
 */
function flattenFields(
  node: any,
  out: Record<string, string>,
  depth = 0
): void {
  if (depth > 3 || node == null || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) {
    if (v == null) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      if (!(k in out) && String(v).trim()) out[k] = String(v);
    } else if (Array.isArray(v)) {
      const objs = v.filter((x) => x && typeof x === "object");
      if (objs.length > 20) continue;
      if (objs.length === 0) {
        const joined = v.filter((x) => x != null).map(String).join(", ");
        if (joined.trim() && !(k in out)) out[k] = joined;
      } else {
        for (const el of objs) flattenFields(el, out, depth + 1);
      }
    } else {
      flattenFields(v, out, depth + 1);
    }
  }
}

export async function getDetail(
  target: TargetKey,
  id: string
): Promise<{
  target: TargetKey;
  id: string;
  fields: Record<string, string>;
  detailUrl: string;
} | null> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning null");
    return null;
  }
  const spec = TARGET_REGISTRY[target];
  if (!spec) {
    logger.warn("law-api: unknown target", { target });
    return null;
  }
  if (!spec.supported) {
    logger.warn("law-api: target not permitted for current LAW_OC — returning null", {
      target,
      label: spec.label
    });
    return null;
  }
  const key = `law:getDetail:${target}:${id}`;
  return withCache<{
    target: TargetKey;
    id: string;
    fields: Record<string, string>;
    detailUrl: string;
  } | null>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawService.do", {
        target,
        [spec.detailIdParam]: id
      });
      if (!raw || typeof raw !== "object") return null;

      // 최상위에 중첩 객체가 있으면 그것이 실제 payload
      let node: any = raw;
      for (const v of Object.values(raw)) {
        if (v && typeof v === "object" && !Array.isArray(v)) {
          node = v;
          break;
        }
      }

      const fields: Record<string, string> = {};
      flattenFields(node, fields);
      if (Object.keys(fields).length === 0) return null;

      return {
        target,
        id,
        fields,
        detailUrl: toAbsoluteUrl(firstField(fields, spec.linkFields ?? []))
      };
    } catch (err) {
      logger.warn("law-api getDetail failed", { target, id, err: String(err) });
      return null;
    }
  });
}

// ---------- 하위 호환 래퍼 ----------

export const searchLaw = (q: string, limit = 5) => searchTarget("law", q, limit);
export const searchEffectiveLaw = (q: string, limit = 5) =>
  searchTarget("eflaw", q, limit);
export const searchPrecedent = (q: string, limit = 5) =>
  searchTarget("prec", q, limit);
export const searchInterpretation = (q: string, limit = 5) =>
  searchTarget("expc", q, limit);
export const searchAdminJudgment = (q: string, limit = 5) =>
  searchTarget("decc", q, limit);
export const searchAdminRule = (q: string, limit = 5) =>
  searchTarget("admrul", q, limit);
export const searchOrdinance = (q: string, limit = 5) =>
  searchTarget("ordin", q, limit);
export const searchForm = (q: string, limit = 5) =>
  searchTarget("licbyl", q, limit);
export const searchAdminRuleForm = (q: string, limit = 5) =>
  searchTarget("admbyl", q, limit);
export const searchOrdinanceForm = (q: string, limit = 5) =>
  searchTarget("ordinbyl", q, limit);
export const searchTreaty = (q: string, limit = 5) =>
  searchTarget("trty", q, limit);

export const searchSpecialAdminJudgment = (
  kind: SpecialDeccKind,
  q: string,
  limit = 5
) => searchTarget(SPECIAL_DECC_TARGETS[kind].target, q, limit);
export const searchConstitutionalDecision = (q: string, limit = 5) =>
  searchTarget("detc", q, limit);
export const searchLegalTerm = (q: string, limit = 5) =>
  searchTarget("lstrm", q, limit);
export const searchThreeWayCompare = (q: string, limit = 5) =>
  searchTarget("thdCmp", q, limit);
export const searchOldAndNew = (q: string, limit = 5) =>
  searchTarget("oldAndNew", q, limit);
export const searchRelatedLaw = (q: string, limit = 5) =>
  searchTarget("lsRlt", q, limit);
export const searchLawSystemMap = (q: string, limit = 5) =>
  searchTarget("lsStmd", q, limit);

export const searchMinistryInterpretation = (
  ministry: MinistryKey,
  q: string,
  limit = 5
) => searchTarget(MINISTRY_TARGETS[ministry].target, q, limit);

/** 조문 본문 검색 — 검색 응답에 조문내용(본문)이 포함된다 */
export const searchArticleFullText = (q: string, limit = 5) =>
  searchTarget("aiSearch", q, limit);
export const searchRelatedArticles = (q: string, limit = 5) =>
  searchTarget("aiRltLs", q, limit);

export const searchAdminRuleByType = (
  kind: AdmRulTypeKey,
  q: string,
  limit = 5
) => searchTarget(ADMRUL_TYPE_TARGETS[kind].target, q, limit);

// ---------- 정확 매칭 검색 ----------

/** 사건번호 정확 매칭 (예: "2013다51674") — search=1 */
export async function searchPrecedentByNumber(
  caseNumber: string,
  limit = 5
): Promise<LawResultItem[]> {
  if (!envReady()) {
    logger.warn("law-api: env missing — returning []");
    return [];
  }
  const spec = TARGET_REGISTRY.prec;
  const key = `law:searchPrecedentByNumber:${caseNumber}:${limit}`;
  return withCache<LawResultItem[]>(key, CACHE_TTL_DAY, async () => {
    try {
      const raw = await callDrf("lawSearch.do", {
        target: "prec",
        query: caseNumber,
        display: limit,
        page: 1,
        search: 1
      });
      const payload = pickWrapper(raw, spec.wrappers);
      const list = pickItems(payload, raw, spec.itemKeys);
      return list
        .map((it) => mapItem("prec", spec, it))
        .filter((it) => Boolean(it.title));
    } catch (err) {
      logger.warn("law-api searchPrecedentByNumber failed", {
        caseNumber,
        err: String(err)
      });
      return [];
    }
  });
}

/** 법령명 정확 일치 필터 — searchLaw 결과에서 제목이 정확히 일치하는 것만 */
export async function searchLawExact(
  name: string,
  limit = 5
): Promise<LawResultItem[]> {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ");
  const wanted = norm(name);
  const items = await searchTarget("law", name, Math.max(limit, 10));
  const exact = items.filter((it) => norm(it.title) === wanted);
  const matched = exact.length
    ? exact
    : items.filter((it) => norm(it.title).startsWith(wanted));
  return matched.slice(0, limit);
}

export const getLawDetail = (mst: string) => getDetail("law", mst);
export const getPrecedentDetail = (id: string) => getDetail("prec", id);
export const getInterpretationDetail = (id: string) => getDetail("expc", id);
export const getAdminJudgmentDetail = (id: string) => getDetail("decc", id);
export const getAdminRuleDetail = (id: string) => getDetail("admrul", id);
export const getMinistryInterpretationDetail = (
  ministry: MinistryKey,
  id: string
) => getDetail(MINISTRY_TARGETS[ministry].target, id);

// ---------- 별표서식 파일 링크 ----------

/**
 * NOTE: searchForm / searchAdminRuleForm / searchOrdinanceForm은 이제 검색 결과에서
 * 다운로드 링크(hwpUrl/pdfUrl)를 직접 반환한다. 이 함수는 "특정 법령 하나의 별표 전체를
 * 열거"하는 용도로만 남겨둔다 (XML 경로).
 */
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
