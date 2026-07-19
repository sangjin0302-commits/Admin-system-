/**
 * 국가법령정보센터(법제처) DRF API 클라이언트 — 레지스트리 기반.
 *
 * DRF는 엔드포인트가 lawSearch.do / lawService.do 2개뿐이며,
 * target 파라미터로 도메인을 구분한다. wrapper key / item key는 target마다 다르다.
 * Vercel IP 화이트리스트 불가 → Lightsail 프록시(3.36.175.81:8080) 경유.
 *
 * TARGET_REGISTRY는 총 85개 target으로, supported: true 항목(83개)은
 * OC=sangjin_api로 실제 호출해 확인한 실측값이다.
 * supported: false 항목(2개, lstrmRlt/dlytrmRlt)은 DRF target 파라미터 이름이
 * 확인되지 않아 빈 응답만 오며, 호출 없이 즉시 []/null을 반환한다.
 *
 * 권한 문제가 아니다: 법제처 OPEN API 신청 화면의 공동활용 법령종류 20종은
 * 전부 신청 완료 상태다. 미지원 2건은 순전히 target 이름 미확인 때문이다.
 *
 * 부처별 유권해석(38종)은 `{부처영문약칭}CgmExpc` 규칙이며 shape가 전부 동일하다.
 * 부처명이 바뀌면 약칭도 바뀐다: 여성가족부→성평등가족부이므로 mow가 아니라 mogef다.
 * ⚠️ mof=해양수산부 / moef=기획재정부 — 약칭이 비슷해 혼동 주의(과거 mof를 기재부로 오기했다).
 *
 * 헌재결정례는 detc, 노동위원회는 nlrc, 국민권익위는 acr,
 * 고용보험심사위원회는 eiac target을 쓴다
 * (ccourt/nodong/acrc/empins/mow는 실재하지 않는 target이라 제거했다).
 * 감사원·법령안(입법예고)은 법제처 공동활용 대상이 아니라 아예 제거했다.
 *
 * 실패 원인 구분이 필요하면 searchTarget 대신 searchTargetDetailed를 쓸 것.
 * 법제처는 없는 target에도 빈 200을 주므로, 빈 결과와 오류는 스스로 구분해야 한다.
 *
 * 주의: 검색 응답에는 본문/요지(판시사항·질의요지 등)가 없다. 요지는 상세 호출로만 얻는다.
 * 예외: aiSearch는 검색 응답에 조문내용(본문)을 포함하는 유일한 target이다.
 */

import { logger } from "@/lib/utils/logger";
import { cacheGet, cacheSet, withCache } from "@/lib/services/cache-service";

/**
 * env는 모듈 top-level 상수로 잡지 않고 호출 시점에 읽는다.
 * Vercel은 빌드 캐시를 재사용하므로, 이 파일이 바뀌지 않은 채로
 * 나중에 환경변수를 추가하면 top-level 상수에는 빌드 당시의 빈 값이
 * 그대로 박혀 있게 된다(실제로 그렇게 전 기능이 []를 반환했다).
 */
function lawProxyUrl(): string {
  return process.env.LAW_PROXY_URL || "http://3.36.175.81:8080";
}

/**
 * 프록시가 평문 HTTP인지 검사한다.
 *
 * 현재 프록시(Lightsail 3.36.175.81:8080)는 TLS가 없어 X-Proxy-Token 이
 * 암호화 없이 전송된다. 데이터(법령) 자체는 공개 정보지만 토큰은 유출 위험이 있다.
 *
 * HTTPS 전환은 코드가 아니라 인프라 작업이다:
 *   1) 프록시 서버에 도메인+TLS(Caddy/nginx+Let's Encrypt)를 붙이거나
 *   2) Lightsail 로드밸런서 / CloudFront 로 앞단에 무료 TLS를 두고
 *   3) LAW_PROXY_URL 을 https:// 주소로 바꾼다(코드 변경 불필요 — 이미 env를 읽는다).
 *
 * 이 함수는 진단 화면에서 위험을 눈에 보이게 하고, 프로덕션에서 한 번 경고 로그를 남긴다.
 */
export function lawProxySecurity(): { url: string; secure: boolean; warning: string | null } {
  const url = lawProxyUrl();
  const secure = url.trim().toLowerCase().startsWith("https://");
  return {
    url,
    secure,
    warning: secure
      ? null
      : "프록시가 평문 HTTP입니다 — X-Proxy-Token 이 암호화 없이 전송됩니다. HTTPS 전환 권장(인프라 작업).",
  };
}

let _warnedInsecureProxy = false;
function warnIfInsecureLawProxy(): void {
  if (_warnedInsecureProxy) return;
  if (process.env.NODE_ENV !== "production") return;
  const { secure, warning } = lawProxySecurity();
  if (!secure && warning) {
    _warnedInsecureProxy = true;
    // logger는 파일 하단에서 import됨. 순환을 피하려 동적 경고 대신 console 사용.
    console.warn(`[law-proxy] ${warning}`);
  }
}
function lawProxyToken(): string {
  return process.env.LAW_PROXY_TOKEN || "";
}
function lawOc(): string {
  return process.env.LAW_OC || "";
}

const CACHE_TTL_DAY = 86400;
const PROXY_TIMEOUT_MS = 10_000;
const LAW_BASE_URL = "https://www.law.go.kr";

function envReady(): boolean {
  return Boolean(lawProxyToken() && lawOc());
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
    OC: lawOc(),
    type,
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    )
  });
  return `${lawProxyUrl()}/drf/${endpoint}?${qs.toString()}`;
}

async function fetchProxy(url: string, endpoint: string): Promise<any> {
  warnIfInsecureLawProxy();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-Proxy-Token": lawProxyToken() },
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
  | "prec"
  | "expc" | "decc"
  | "molitCgmExpc" | "moelCgmExpc" | "ntsCgmExpc"
  | "mojCgmExpc" | "mofCgmExpc" | "mssCgmExpc" | "kcsCgmExpc" | "mpvaCgmExpc"
  | "molegCgmExpc" | "moefCgmExpc" | "mogefCgmExpc" | "moeCgmExpc"
  | "msitCgmExpc" | "mndCgmExpc" | "moisCgmExpc" | "mafraCgmExpc"
  | "mcstCgmExpc" | "mohwCgmExpc" | "motieCgmExpc" | "mofaCgmExpc"
  | "meCgmExpc" | "mfdsCgmExpc" | "mpmCgmExpc" | "kmaCgmExpc"
  | "khsCgmExpc" | "rdaCgmExpc" | "npaCgmExpc" | "dapaCgmExpc"
  | "mmaCgmExpc" | "kfsCgmExpc" | "nfaCgmExpc" | "okaCgmExpc"
  | "ppsCgmExpc" | "kdcaCgmExpc" | "kostatCgmExpc" | "kipoCgmExpc"
  | "kcgCgmExpc" | "naaccCgmExpc"
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
  | "nlrc" | "acr"
  | "ftc" | "fsc" | "ppc"
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

/**
 * 🔒 실측 검증 완료 — 함부로 수정하지 말 것
 *
 * supported: true 항목의 wrappers/itemKeys/필드명은 전부 라이브 응답으로 확인한 값이다.
 * 법제처는 없는 target에도 빈 200을 주므로, 이름이 틀려도 "결과 없음"처럼 보인다.
 * 추측으로 바꾸면 조용히 죽고 아무도 모른다 (이 세션에서만 그렇게 5건이 숨어 있었다).
 *
 * 수정 절차:
 *   1) 프록시로 실호출: /drf/lawSearch.do?OC=...&target=<key>&type=JSON&query=<질의>
 *   2) 응답의 최상위 키 = wrappers, 그 안의 배열/객체 키 = itemKeys
 *   3) law-registry-lock.ts 의 LOCKED_SPECS 와 LOCKED_AT 갱신
 *   4) 헬스체크 실행해 실패 0 확인 (/admin/law-research 상단 "지금 점검")
 */
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
  //
  // ⚠️ mof = 해양수산부, moef = 기획재정부. 이름이 비슷해 혼동하기 쉽다.
  //    (mof를 "기획재정부"로 잘못 라벨링했던 것을 프로브로 확인해 바로잡았다.)
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
    label: "해양수산부 유권해석",
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

  molegCgmExpc: {
    key: "molegCgmExpc",
    label: "법제처 유권해석",
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
  moefCgmExpc: {
    key: "moefCgmExpc",
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
  mogefCgmExpc: {
    key: "mogefCgmExpc",
    label: "성평등가족부 유권해석",
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
  moeCgmExpc: {
    key: "moeCgmExpc",
    label: "교육부 유권해석",
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
  msitCgmExpc: {
    key: "msitCgmExpc",
    label: "과학기술정보통신부 유권해석",
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
  mndCgmExpc: {
    key: "mndCgmExpc",
    label: "국방부 유권해석",
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
  moisCgmExpc: {
    key: "moisCgmExpc",
    label: "행정안전부 유권해석",
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
  mafraCgmExpc: {
    key: "mafraCgmExpc",
    label: "농림축산식품부 유권해석",
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
  mcstCgmExpc: {
    key: "mcstCgmExpc",
    label: "문화체육관광부 유권해석",
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
  mohwCgmExpc: {
    key: "mohwCgmExpc",
    label: "보건복지부 유권해석",
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
  motieCgmExpc: {
    key: "motieCgmExpc",
    label: "산업통상부 유권해석",
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
  mofaCgmExpc: {
    key: "mofaCgmExpc",
    label: "외교부 유권해석",
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
  meCgmExpc: {
    key: "meCgmExpc",
    label: "기후에너지환경부 유권해석",
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
  mfdsCgmExpc: {
    key: "mfdsCgmExpc",
    label: "식품의약품안전처 유권해석",
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
  mpmCgmExpc: {
    key: "mpmCgmExpc",
    label: "인사혁신처 유권해석",
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
  kmaCgmExpc: {
    key: "kmaCgmExpc",
    label: "기상청 유권해석",
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
  khsCgmExpc: {
    key: "khsCgmExpc",
    label: "국가유산청 유권해석",
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
  rdaCgmExpc: {
    key: "rdaCgmExpc",
    label: "농촌진흥청 유권해석",
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
  npaCgmExpc: {
    key: "npaCgmExpc",
    label: "경찰청 유권해석",
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
  dapaCgmExpc: {
    key: "dapaCgmExpc",
    label: "방위사업청 유권해석",
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
  mmaCgmExpc: {
    key: "mmaCgmExpc",
    label: "병무청 유권해석",
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
  kfsCgmExpc: {
    key: "kfsCgmExpc",
    label: "산림청 유권해석",
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
  nfaCgmExpc: {
    key: "nfaCgmExpc",
    label: "소방청 유권해석",
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
  okaCgmExpc: {
    key: "okaCgmExpc",
    label: "재외동포청 유권해석",
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
  ppsCgmExpc: {
    key: "ppsCgmExpc",
    label: "조달청 유권해석",
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
  kdcaCgmExpc: {
    key: "kdcaCgmExpc",
    label: "질병관리청 유권해석",
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
  kostatCgmExpc: {
    key: "kostatCgmExpc",
    label: "국가데이터처 유권해석",
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
  kipoCgmExpc: {
    key: "kipoCgmExpc",
    label: "지식재산처 유권해석",
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
  kcgCgmExpc: {
    key: "kcgCgmExpc",
    label: "해양경찰청 유권해석",
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
  naaccCgmExpc: {
    key: "naaccCgmExpc",
    label: "행정중심복합도시건설청 유권해석",
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

  // 헌재결정례의 실동작 target (ccourt는 실재하지 않는 target이라 제거했다)
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
    // 실측: 질의에 따라 wrapper가 lsRltSearch / Law 로 갈린다 (법제처 비일관성).
    // 헬스체크 parse_error 로 "실제 최상위 키: Law" 를 확인해 fallback 추가.
    wrappers: ["lsRltSearch", "Law", "LawSearch"],
    itemKeys: ["법령", "law"],
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

  // ===== 위원회 (실측 검증) =====
  nlrc: {
    key: "nlrc",
    label: "중앙노동위원회 결정문",
    group: "위원회",
    wrappers: ["Nlrc"],
    itemKeys: ["nlrc"],
    idFields: ["결정문일련번호"],
    titleFields: ["제목"],
    agencyFields: [],
    dateFields: ["등록일"],
    numberFields: ["사건번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },
  acr: {
    key: "acr",
    label: "국민권익위원회 결정문",
    group: "위원회",
    wrappers: ["Acr"],
    itemKeys: ["acr"],
    idFields: ["결정문일련번호"],
    titleFields: ["제목"],
    agencyFields: ["회의종류"],
    dateFields: ["의결일"],
    numberFields: ["의안번호"],
    linkFields: ["결정문상세링크"],
    detailIdParam: "ID",
    verified: true,
    supported: true
  },

  // ===== 미지원: target 이름 미확인 =====
  //
  // 법제처 OPEN API 신청 화면의 "공동활용 법령종류" 20종은 전부 신청·체크된 상태다.
  // 따라서 이들이 안 되는 것은 권한 문제가 아니라 target 이름 문제다.
  //
  // - lstrmRlt / dlytrmRlt: 법령용어 자체(lstrm/dlytrm)는 신청·동작 확인됨.
  //               연계(Rlt) 하위 기능의 target명이 확인되지 않는다.
  //
  // ⚠️ 프록시 경유로는 이 둘 모두 완전히 빈 200만 온다(JSON·XML·HTML 전부 raw_len=0).
  //    없는 target과 미신청 target의 응답이 구분되지 않으므로, 빈 응답만으로
  //    원인을 단정하지 말 것. 실제로 이 파일에서만 5번 오판했다:
  //      ccourt→detc / nodong→nlrc / acrc→acr / empins→eiac / mow→mogef
  //    전부 lawbot(_lib.py)에서 가져온 미검증 이름이었다.
  //
  // 감사원 사전컨설팅 의견서: 신청 화면에는 체크돼 있으나 target 이름을 찾지 못했다.
  //   시도한 후보: bai / baiConsult / baiCnslt / baiPreCnslt / preConsult / auditConsult 등 15종 — 전부 빈 응답.
  //   통일부 유권해석도 동일 (unikoreaCgmExpc / muCgmExpc / unikCgmExpc 등 실패).
  //   법제처 문의(02-2109-6446)로 정확한 target 값 확인 필요.
  //
  // 확인 경로: 법제처 공동활용 유지보수팀 02-2109-6446
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
  dapa: { target: "dapaCgmExpc", label: "방위사업청" },
  kcg: { target: "kcgCgmExpc", label: "해양경찰청" },
  kcs: { target: "kcsCgmExpc", label: "관세청" },
  kdca: { target: "kdcaCgmExpc", label: "질병관리청" },
  kfs: { target: "kfsCgmExpc", label: "산림청" },
  khs: { target: "khsCgmExpc", label: "국가유산청" },
  kipo: { target: "kipoCgmExpc", label: "지식재산처" },
  kma: { target: "kmaCgmExpc", label: "기상청" },
  kostat: { target: "kostatCgmExpc", label: "국가데이터처" },
  mafra: { target: "mafraCgmExpc", label: "농림축산식품부" },
  mcst: { target: "mcstCgmExpc", label: "문화체육관광부" },
  me: { target: "meCgmExpc", label: "기후에너지환경부" },
  mfds: { target: "mfdsCgmExpc", label: "식품의약품안전처" },
  mma: { target: "mmaCgmExpc", label: "병무청" },
  mnd: { target: "mndCgmExpc", label: "국방부" },
  moe: { target: "moeCgmExpc", label: "교육부" },
  moef: { target: "moefCgmExpc", label: "기획재정부" },
  moel: { target: "moelCgmExpc", label: "고용노동부" },
  mof: { target: "mofCgmExpc", label: "해양수산부" },
  mofa: { target: "mofaCgmExpc", label: "외교부" },
  mogef: { target: "mogefCgmExpc", label: "성평등가족부" },
  mohw: { target: "mohwCgmExpc", label: "보건복지부" },
  mois: { target: "moisCgmExpc", label: "행정안전부" },
  moj: { target: "mojCgmExpc", label: "법무부" },
  moleg: { target: "molegCgmExpc", label: "법제처" },
  molit: { target: "molitCgmExpc", label: "국토교통부" },
  motie: { target: "motieCgmExpc", label: "산업통상부" },
  mpm: { target: "mpmCgmExpc", label: "인사혁신처" },
  mpva: { target: "mpvaCgmExpc", label: "국가보훈부" },
  msit: { target: "msitCgmExpc", label: "과학기술정보통신부" },
  mss: { target: "mssCgmExpc", label: "중소벤처기업부" },
  naacc: { target: "naaccCgmExpc", label: "행정중심복합도시건설청" },
  nfa: { target: "nfaCgmExpc", label: "소방청" },
  npa: { target: "npaCgmExpc", label: "경찰청" },
  nts: { target: "ntsCgmExpc", label: "국세청" },
  oka: { target: "okaCgmExpc", label: "재외동포청" },
  pps: { target: "ppsCgmExpc", label: "조달청" },
  rda: { target: "rdaCgmExpc", label: "농촌진흥청" }
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

// ---------- 진단 가능한 결과 봉투 ----------

/**
 * 법제처는 실패를 제대로 신호하지 않는다. 없는 target도 빈 200, 잘못된 파라미터는
 * 500 또는 빈 응답이다. 그래서 "정상적으로 0건"과 "고장나서 0건"을 우리가 구분해야 한다.
 * catch { return [] } 로 뭉개면 모든 실패가 똑같이 "결과 없음"으로 보인다.
 */
export type LawFetchStatus =
  | "ok" // 결과 있음
  | "empty" // 정상 응답, 결과 0건
  | "not_permitted" // registry에서 supported:false
  | "unknown_target" // registry에 없는 key
  | "env_missing" // LAW_OC/LAW_PROXY_TOKEN 미설정
  | "upstream_error" // 프록시/법제처 호출 실패 (HTTP 오류·타임아웃)
  | "parse_error"; // 응답은 왔으나 wrapper/itemKey 불일치

export type LawSearchOutcome = {
  status: LawFetchStatus;
  items: LawResultItem[];
  message: string; // 한국어, 사람이 읽는 설명
  target: TargetKey | string;
};

export type LawDetailOutcome = {
  status: LawFetchStatus;
  detail: {
    target: TargetKey;
    id: string;
    fields: Record<string, string>;
    detailUrl: string;
  } | null;
  message: string;
  target: TargetKey | string;
};

/** 오류 상태는 캐시하면 안 된다 — 일시적 장애가 24h 동안 굳어버린다. */
function isCacheableStatus(status: LawFetchStatus): boolean {
  return status === "ok" || status === "empty";
}

/** totalCnt/totcnt가 "0"이거나 아예 없으면 정상적인 0건으로 본다. */
function readTotalCount(payload: any, raw: any): string | null {
  for (const src of [payload, raw]) {
    for (const k of ["totalCnt", "totcnt", "TotalCnt"]) {
      const v = src?.[k];
      if (v != null) return String(v).trim();
    }
  }
  return null;
}

// ---------- 코어: 검색 ----------

/**
 * searchTarget의 진단 가능 버전. 실패 원인을 구분해 반환한다.
 *
 * NOTE: 기존 searchTarget은 withCache가 catch { return [] } 를 감싸고 있어서
 * 일시적 프록시 장애까지 24시간 캐시에 박혔다. 여기서는 ok/empty만 캐시한다.
 */
export async function searchTargetDetailed(
  target: TargetKey,
  query: string,
  limit = 5
): Promise<LawSearchOutcome> {
  if (!envReady()) {
    const message = "법제처 API 환경변수(LAW_OC/LAW_PROXY_TOKEN)가 설정되지 않았습니다.";
    logger.warn("law-api: env missing", { target, message });
    return { status: "env_missing", items: [], message, target };
  }
  const spec = TARGET_REGISTRY[target];
  if (!spec) {
    const message = `등록되지 않은 target입니다: ${target}`;
    logger.warn("law-api: unknown target", { target, message });
    return { status: "unknown_target", items: [], message, target };
  }
  if (!spec.supported) {
    const message = `${spec.label}: DRF target 파라미터 이름이 확인되지 않아 조회할 수 없습니다.`;
    logger.warn("law-api: target not supported", { target, message });
    return { status: "not_permitted", items: [], message, target };
  }

  const key = `law:searchTargetDetailed:${target}:${query}:${limit}`;
  const cached = cacheGet<LawSearchOutcome>(key);
  if (cached) return cached;

  let raw: any;
  try {
    raw = await callDrf("lawSearch.do", {
      target,
      query,
      display: limit,
      page: 1,
      ...(spec.searchParams ?? {})
    });
  } catch (err) {
    const message = `법제처 응답 오류: ${String(err)}`;
    logger.warn("law-api searchTargetDetailed upstream failed", {
      target,
      query,
      message
    });
    return { status: "upstream_error", items: [], message, target };
  }

  // wrapper를 하나도 못 찾았는데 응답에 키가 있다 = 파서와 실제 응답 shape가 어긋났다.
  // (Expc vs ExpcSearch 같은 wrapper 이름 불일치를 여기서 잡는다)
  const topKeys = raw && typeof raw === "object" ? Object.keys(raw) : [];
  const wrapperFound = spec.wrappers.some((w) => raw?.[w]);
  if (!wrapperFound && topKeys.length > 0) {
    const message =
      `파서 불일치: 기대한 wrapper(${spec.wrappers.join(", ")})가 없습니다. ` +
      `실제 최상위 키: ${topKeys.join(", ")}`;
    logger.warn("law-api searchTargetDetailed parse mismatch", {
      target,
      query,
      message
    });
    return { status: "parse_error", items: [], message, target };
  }

  const payload = pickWrapper(raw, spec.wrappers);
  const list = pickItems(payload, raw, spec.itemKeys);
  const items = list
    .map((it) => mapItem(target, spec, it))
    .filter((it) => Boolean(it.title));

  let outcome: LawSearchOutcome;
  if (items.length === 0) {
    const total = readTotalCount(payload, raw);
    if (total == null || total === "0") {
      outcome = {
        status: "empty",
        items: [],
        message: `${spec.label}: "${query}" 검색 결과가 0건입니다.`,
        target
      };
    } else {
      // 총건수는 있는데 item을 못 뽑았다 = itemKey 불일치
      const message =
        `파서 불일치: 총 ${total}건이라고 응답했으나 itemKey(${spec.itemKeys.join(", ")})로 ` +
        `항목을 찾지 못했습니다. payload 키: ${
          payload && typeof payload === "object" ? Object.keys(payload).join(", ") : "(없음)"
        }`;
      logger.warn("law-api searchTargetDetailed itemKey mismatch", {
        target,
        query,
        message
      });
      return { status: "parse_error", items: [], message, target };
    }
  } else {
    outcome = {
      status: "ok",
      items,
      message: `${spec.label}: ${items.length}건`,
      target
    };
  }

  if (isCacheableStatus(outcome.status)) cacheSet(key, outcome, CACHE_TTL_DAY);
  return outcome;
}

/** 하위 호환 — 기존 호출자는 그대로 items만 받는다. */
export async function searchTarget(
  target: TargetKey,
  query: string,
  limit = 5
): Promise<LawResultItem[]> {
  return (await searchTargetDetailed(target, query, limit)).items;
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

/** getDetail의 진단 가능 버전. searchTargetDetailed와 같은 봉투 규칙을 따른다. */
export async function getDetailDetailed(
  target: TargetKey,
  id: string
): Promise<LawDetailOutcome> {
  if (!envReady()) {
    const message = "법제처 API 환경변수(LAW_OC/LAW_PROXY_TOKEN)가 설정되지 않았습니다.";
    logger.warn("law-api: env missing", { target, message });
    return { status: "env_missing", detail: null, message, target };
  }
  const spec = TARGET_REGISTRY[target];
  if (!spec) {
    const message = `등록되지 않은 target입니다: ${target}`;
    logger.warn("law-api: unknown target", { target, message });
    return { status: "unknown_target", detail: null, message, target };
  }
  if (!spec.supported) {
    const message = `${spec.label}: DRF target 파라미터 이름이 확인되지 않아 조회할 수 없습니다.`;
    logger.warn("law-api: target not supported", { target, message });
    return { status: "not_permitted", detail: null, message, target };
  }

  const key = `law:getDetailDetailed:${target}:${id}`;
  const cached = cacheGet<LawDetailOutcome>(key);
  if (cached) return cached;

  let raw: any;
  try {
    raw = await callDrf("lawService.do", { target, [spec.detailIdParam]: id });
  } catch (err) {
    const message = `법제처 응답 오류: ${String(err)}`;
    logger.warn("law-api getDetailDetailed upstream failed", { target, id, message });
    return { status: "upstream_error", detail: null, message, target };
  }

  if (!raw || typeof raw !== "object") {
    const message = `상세 응답이 객체가 아닙니다(${typeof raw}).`;
    logger.warn("law-api getDetailDetailed bad shape", { target, id, message });
    return { status: "parse_error", detail: null, message, target };
  }

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

  let outcome: LawDetailOutcome;
  if (Object.keys(fields).length === 0) {
    const topKeys = Object.keys(raw);
    if (topKeys.length === 0) {
      outcome = {
        status: "empty",
        detail: null,
        message: `${spec.label}: ID ${id} 에 대한 상세 내용이 없습니다.`,
        target
      };
    } else {
      const message = `파서 불일치: 상세 응답에서 필드를 추출하지 못했습니다. 최상위 키: ${topKeys.join(", ")}`;
      logger.warn("law-api getDetailDetailed parse mismatch", { target, id, message });
      return { status: "parse_error", detail: null, message, target };
    }
  } else {
    outcome = {
      status: "ok",
      detail: {
        target,
        id,
        fields,
        detailUrl: toAbsoluteUrl(firstField(fields, spec.linkFields ?? []))
      },
      message: `${spec.label}: ${Object.keys(fields).length}개 필드`,
      target
    };
  }

  if (isCacheableStatus(outcome.status)) cacheSet(key, outcome, CACHE_TTL_DAY);
  return outcome;
}

/** 하위 호환 — 기존 호출자는 그대로 detail 또는 null을 받는다. */
export async function getDetail(
  target: TargetKey,
  id: string
): Promise<{
  target: TargetKey;
  id: string;
  fields: Record<string, string>;
  detailUrl: string;
} | null> {
  return (await getDetailDetailed(target, id)).detail;
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
