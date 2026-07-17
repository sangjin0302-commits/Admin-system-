/**
 * 생활법령정보 (easylaw.go.kr) SOAP 클라이언트 — admin 전용.
 *
 * 법제처 DRF(law-api-service)와 별개 API. IP 화이트리스트가 없어
 * Lightsail 프록시를 거치지 않고 Vercel에서 직접 호출한다.
 *
 * ⚠️ 일일 트래픽 100건/기능 — 반드시 캐시를 경유할 것.
 * ⚠️ 고객 경로에서 import 금지 (admin 전용).
 *
 * 라이브 실측 (2026-07):
 *  - LifeLawInfoService 요청에 nowPageNo/pageMg 를 넣으면 HTTP 500. 페이징 없음.
 *  - 판례류 4종 응답: {Op}Item > {inner}ListItems > {inner}ListItem (Lk 목록은 별개, 무시)
 *  - 대법원판례 필드: precDp(판결표시) / judItm(판시사항) / precGst(판결요지) / cciNm / cnpClsNm
 *  - 검색(getSearchAllKeywordList)만 nowPageNo/pageMg 지원
 *  - 검증 예: csmSeq=514, ccfNo=1, cciNo=1, cnpClsNo=1 → 대법원판례 16건
 */

import { logger } from "@/lib/utils/logger";
import { withCache } from "@/lib/services/cache-service";

const EASYLAW_KEY = process.env.EASYLAW_KEY || "";
const EASYLAW_BASE = "https://www.easylaw.go.kr/OPENAPI/soap";
const CACHE_TTL_DAY = 86400;
const SOAP_TIMEOUT_MS = 15_000;

const SERVICE_SEARCH = "LifeLawSearchService";
const SERVICE_INFO = "LifeLawInfoService";
const SERVICE_ENG = "EnglishLifeLawInfoService";
const SERVICE_MQNA = "ManyAskManyAnswerService";
const EASYLAW_SITE = "https://www.easylaw.go.kr";

export type LifeKeys = {
  csmSeq: string;
  ccfNo: string;
  cciNo: string;
  cnpClsNo: string;
};

export type LifeSearchCategory =
  | "qa" // 백문백답
  | "precedent" // 대법원판례
  | "interpretation" // 법령해석
  | "lifeArea" // 생활분야
  | "groupArea" // 그룹분야
  | "interestRule"; // 관심규정

export type LifeLawSearchItem = {
  category: LifeSearchCategory;
  categoryLabel: string; // 한국어 표시명
  title: string; // stripTags 적용
  summary: string; // judItm(판례) / onhunqueSubjNm(백문백답) / 없으면 ""
  tree: string; // 분류 경로 — &gt; 디코드 후 " > " 로 정규화
  /** LifeLawInfoService 조회용 4키 — 없는 카테고리도 있음 */
  keys: LifeKeys | null;
  /** 백문백답 상세용 (onhunqnaAstSeq/onhunqueSeq) */
  mqnaKeys: { onhunqnaAstSeq: string; onhunqueSeq: string } | null;
  link: string; // titleLink / moblieTitleLink, 절대화
  fields: Record<string, string>; // 원본 전체
};

export type LifeClassItem = { id: string; name: string; linkUrl: string; order: string };
export type LifeAreaItem = { csmSeq: string; title: string; summary: string; note: string };
export type LifeGenericItem = { fields: Record<string, string> };

/** 판례·재결례·해석례·헌재결정례 4종 공통 shape */
export type LifeCaseItem = {
  display: string; // precDp 등 — 판결/재결 표시
  issue: string; // judItm — 판시사항
  gist: string; // precGst — 판결요지
  itemName: string; // cciNm
  className: string; // cnpClsNm
  fields: Record<string, string>; // 원본 전체 (미매핑 필드 보존)
};

export type LifeCaseBundle = {
  precedents: LifeCaseItem[];
  adminReferees: LifeCaseItem[];
  interpretations: LifeCaseItem[];
  constitutional: LifeCaseItem[];
};

function envReady(): boolean {
  return Boolean(EASYLAW_KEY);
}

function escapeXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeXml(s: string): string {
  return String(s ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x0*D;/gi, "\n")
    .replace(/&#13;/g, "\n")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** `<b>` 등 마크업 제거 + 공백 정리 */
function stripTags(s: string): string {
  return decodeXml(String(s ?? ""))
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function xmlFirst(xml: string, tag: string): string {
  const m = new RegExp(`<(?:\\w+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${tag}>`).exec(xml);
  return m ? decodeXml(m[1]).trim() : "";
}

/**
 * `*Item` 으로 끝나는 요소 블록을 훑어 자식 태그를 Record로 평탄화한다.
 * 응답 leaf shape이 미검증이라 방어적으로 파싱한다.
 */
function xmlItems(xml: string, itemTagSuffix = "Item"): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  const suffix = escapeRe(itemTagSuffix);
  const re = new RegExp(`<(\\w*${suffix})(?:\\s[^>]*)?>([\\s\\S]*?)</\\1>`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const body = m[2];
    if (!/<\w/.test(body)) continue; // 자식 태그 없는 블록은 스킵
    const rec: Record<string, string> = {};
    const childRe = /<(\w+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g;
    let c: RegExpExecArray | null;
    while ((c = childRe.exec(body)) !== null) {
      const val = c[2];
      if (/<\w/.test(val)) continue; // 중첩 컨테이너는 별도 Item으로 잡힘
      rec[c[1]] = decodeXml(val).trim();
    }
    if (Object.keys(rec).length > 0) out.push(rec);
  }
  return out;
}

/**
 * 장문 텍스트 정규화 — 태그/엔티티 제거 후 문단 구분(\n)은 보존,
 * 줄 안의 연속 공백만 접는다.
 */
function normalizeLongText(s: string): string {
  return decodeXml(String(s ?? ""))
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 지정한 컨테이너 태그 안의 반복 item 만 파싱한다 (Lk 목록 등 오염 방지) */
function xmlItemsIn(xml: string, containerTag: string, itemTag: string): Record<string, string>[] {
  const c = escapeRe(containerTag);
  const container = new RegExp(
    `<(?:\\w+:)?${c}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${c}>`
  ).exec(xml);
  if (!container) return []; // 없거나 self-closing(<X/>) → 빈 목록
  const body = container[1];

  const out: Record<string, string>[] = [];
  const i = escapeRe(itemTag);
  const itemRe = new RegExp(`<(?:\\w+:)?${i}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${i}>`, "g");
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(body)) !== null) {
    const rec: Record<string, string> = {};
    const childRe = /<(\w+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g;
    let ch: RegExpExecArray | null;
    while ((ch = childRe.exec(m[1])) !== null) {
      if (/<\w/.test(ch[2])) continue; // 중첩 컨테이너는 스칼라가 아님
      rec[ch[1]] = normalizeLongText(ch[2]);
    }
    if (Object.keys(rec).length > 0) out.push(rec);
  }
  return out;
}

function pick(rec: Record<string, string>, names: string[], suffix: string): string {
  for (const n of names) {
    if (rec[n]) return rec[n];
  }
  const k = Object.keys(rec).find((key) => key.endsWith(suffix) && rec[key]);
  return k ? rec[k] : "";
}

/**
 * 판례류 레코드를 공통 shape으로 매핑.
 * 대법원판례만 필드 실측 — 나머지 3종은 deccDp/expcDp/detcDp 등 다른 이름일 수 있어
 * 접미사 기반 fallback을 둔다.
 */
function toCaseItems(records: Record<string, string>[]): LifeCaseItem[] {
  return records.map((fields) => ({
    display: pick(fields, ["precDp", "deccDp", "expcDp", "detcDp", "dp"], "Dp"),
    issue: pick(fields, ["judItm", "itm"], "Itm"),
    gist: pick(fields, ["precGst", "gst"], "Gst"),
    itemName: fields.cciNm ?? "",
    className: fields.cnpClsNm ?? "",
    fields
  }));
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checkReturnCode(xml: string): void {
  const code = xmlFirst(xml, "returnCode");
  if (code && !["00", "0", ""].includes(code)) {
    const msg = xmlFirst(xml, "errMsg") || "알 수 없는 오류";
    throw new Error(`easylaw returnCode=${code}: ${msg}`);
  }
}

async function soapCall(service: string, inner: string): Promise<string> {
  const envelope =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ` +
    `xmlns:head="http://apache.org/headers" xmlns:open="http://openapi.affis.go.kr">` +
    `<soapenv:Header><head:ComMsgHeader>` +
    `<RequestMsgID>ethos</RequestMsgID>` +
    `<ServiceKey>${escapeXml(EASYLAW_KEY)}</ServiceKey>` +
    `</head:ComMsgHeader></soapenv:Header>` +
    `<soapenv:Body>${inner}</soapenv:Body>` +
    `</soapenv:Envelope>`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOAP_TIMEOUT_MS);
  try {
    const res = await fetch(`${EASYLAW_BASE}/${service}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: ""
      },
      body: envelope,
      signal: controller.signal
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`easylaw HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/** ⚠️ 검색(LifeLawSearchService)에서만 사용 — InfoService 에 넣으면 HTTP 500 */
function paging(page: number, pageSize: number): string {
  return `<nowPageNo>${Number(page) || 1}</nowPageNo><pageMg>${Number(pageSize) || 5}</pageMg>`;
}

function keysXml(k: LifeKeys): string {
  return (
    `<ccfNo>${escapeXml(k.ccfNo)}</ccfNo>` +
    `<cciNo>${escapeXml(k.cciNo)}</cciNo>` +
    `<cnpClsNo>${escapeXml(k.cnpClsNo)}</cnpClsNo>` +
    `<csmSeq>${escapeXml(k.csmSeq)}</csmSeq>`
  );
}

function toGeneric(records: Record<string, string>[]): LifeGenericItem[] {
  return records.map((fields) => ({ fields }));
}

/** 파라미터 없는 목록 계열 공통 헬퍼 */
async function genericList(
  cacheKey: string,
  operation: string,
  inner: string
): Promise<LifeGenericItem[]> {
  if (!envReady()) {
    logger.warn("easylaw: env missing (EASYLAW_KEY) — returning []");
    return [];
  }
  return withCache(cacheKey, CACHE_TTL_DAY, async () => {
    try {
      const xml = await soapCall(SERVICE_INFO, inner);
      checkReturnCode(xml);
      return toGeneric(xmlItems(xml));
    } catch (err) {
      logger.warn("easylaw call failed", { operation, err: String(err) });
      return [];
    }
  });
}

/**
 * 판례류 4종 공통 헬퍼.
 * 응답: {Op}Item > {inner}ListItems > {inner}ListItem — Lk 목록은 파싱하지 않는다.
 */
async function caseList(
  cacheKey: string,
  operation: string,
  inner: string,
  containerTag: string,
  itemTag: string
): Promise<LifeCaseItem[]> {
  if (!envReady()) {
    logger.warn("easylaw: env missing (EASYLAW_KEY) — returning []");
    return [];
  }
  return withCache(cacheKey, CACHE_TTL_DAY, async () => {
    try {
      const xml = await soapCall(SERVICE_INFO, inner);
      checkReturnCode(xml);
      return toCaseItems(xmlItemsIn(xml, containerTag, itemTag));
    } catch (err) {
      logger.warn("easylaw call failed", { operation, err: String(err) });
      return [];
    }
  });
}

/** 분류 경로 정규화 — `&gt;` 디코드는 decodeXml 이 이미 수행, 구분자만 " > " 로 통일 */
function normalizeTree(s: string): string {
  return stripTags(s)
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" > ");
}

/** 4키가 모두 있을 때만 keys 를 만든다 (일부 카테고리는 csmSeq 뿐) */
function keysOrNull(r: Record<string, string>): LifeKeys | null {
  const { csmSeq, ccfNo, cciNo, cnpClsNo } = r;
  if (!csmSeq || !ccfNo || !cciNo || !cnpClsNo) return null;
  return { csmSeq, ccfNo, cciNo, cnpClsNo };
}

/**
 * 1. 키워드 통합검색
 *
 * ⚠️ 라이브 실측 (2026-07, query="체류자격", wrapper=SearchAllKeywordListResponse):
 * getSearchAllKeywordList 는 결과 컨테이너를 **6개** 병렬로 반환한다
 * (백문백답/대법원판례/법령해석/생활분야/그룹분야/관심규정).
 * 이전 구현은 SearchInterrestRuleListItems 하나만 돌아온 단일 카테고리 probe 를
 * 근거로 작성되어, "체류자격" 등 핵심 키워드에서 6종 중 5종을 통째로 놓치고
 * []를 반환했다. 반드시 6개 컨테이너를 모두 파싱할 것.
 * 컨테이너별로 필드명이 다르므로 xmlItemsIn 으로 스코프를 고정해 형제 오염을 막는다.
 */
export async function searchLifeLaw(
  query: string,
  page = 1,
  pageSize = 5
): Promise<LifeLawSearchItem[]> {
  if (!envReady()) {
    logger.warn("easylaw: env missing (EASYLAW_KEY) — returning []");
    return [];
  }
  const key = `easylaw:search:${query}:${page}:${pageSize}`;
  return withCache(key, CACHE_TTL_DAY, async () => {
    try {
      const inner =
        `<open:getSearchAllKeywordList><SearchAllKeywordListRequest>` +
        `<txtQuery>${escapeXml(query)}</txtQuery>${paging(page, pageSize)}` +
        `</SearchAllKeywordListRequest></open:getSearchAllKeywordList>`;
      const xml = await soapCall(SERVICE_SEARCH, inner);
      checkReturnCode(xml);

      const items = (container: string, itemTag: string) => xmlItemsIn(xml, container, itemTag);

      const qa: LifeLawSearchItem[] = items(
        "MaskMAnswerSearchContentListItems",
        "MaskMAnswerSearchContentListItem"
      ).map((r) => ({
        category: "qa" as const,
        categoryLabel: "백문백답",
        title: stripTags(r.onhunqueCts ?? ""),
        summary: stripTags(r.onhunqueSubjNm ?? ""),
        tree: normalizeTree(r.onhunqnaAstNm ?? ""),
        keys: null,
        mqnaKeys:
          r.onhunqnaAstSeq && r.onhunqueSeq
            ? { onhunqnaAstSeq: r.onhunqnaAstSeq, onhunqueSeq: r.onhunqueSeq }
            : null,
        link: absolutizeUrl(r.moblieTitleLink ?? ""),
        fields: r
      }));

      const precedent: LifeLawSearchItem[] = items(
        "SearchSuperMePrecedentListItems",
        "SearchSuperMePrecedentListItem"
      ).map((r) => ({
        category: "precedent" as const,
        categoryLabel: "대법원판례",
        title: stripTags(r.title ?? ""),
        summary: stripTags(r.judItm ?? ""),
        tree: normalizeTree(r.tree ?? ""),
        keys: keysOrNull(r),
        mqnaKeys: null,
        link: absolutizeUrl(r.titleLink ?? ""),
        fields: r
      }));

      const interpretation: LifeLawSearchItem[] = items(
        "SearchLawInterListItems",
        "SearchLawInterListItem"
      ).map((r) => ({
        category: "interpretation" as const,
        categoryLabel: "법령해석",
        title: stripTags(r.title ?? ""),
        summary: "",
        tree: normalizeTree(r.csmTree ?? ""),
        keys: keysOrNull(r),
        mqnaKeys: null,
        link: absolutizeUrl(r.titleLink ?? ""),
        fields: r
      }));

      const interestRule: LifeLawSearchItem[] = items(
        "SearchInterrestRuleListItems",
        "SearchInterrestRuleListItem"
      ).map((r) => ({
        category: "interestRule" as const,
        categoryLabel: "관심규정",
        title: stripTags(r.title ?? ""),
        summary: "",
        tree: normalizeTree(r.tree ?? ""),
        keys: keysOrNull(r),
        mqnaKeys: null,
        link: absolutizeUrl(r.cnpClsNmLink || r.titleLink || ""),
        fields: r
      }));

      const groupArea: LifeLawSearchItem[] = items(
        "SearchGroupAreaListItems",
        "SearchGroupAreaListItem"
      ).map((r) => ({
        category: "groupArea" as const,
        categoryLabel: "그룹분야",
        title: stripTags(r.title ?? ""),
        summary: "",
        tree: normalizeTree(r.allTree || r.tree || ""),
        keys: keysOrNull(r),
        mqnaKeys: null,
        link: absolutizeUrl(r.titleLink ?? ""),
        fields: r
      }));

      const lifeArea: LifeLawSearchItem[] = items(
        "SearchLifeAreaListItems",
        "SearchLifeAreaListItem"
      ).map((r) => ({
        category: "lifeArea" as const,
        categoryLabel: "생활분야",
        title: stripTags(r.csmTtl ?? ""),
        summary: "",
        tree: normalizeTree(r.tree ?? ""),
        keys: keysOrNull(r), // 보통 csmSeq 만 존재 → null
        mqnaKeys: null,
        link: absolutizeUrl(r.titleLink ?? ""),
        fields: r
      }));

      // pageMg 로 API 측에서 이미 건수 제한 — 파싱된 전부를 반환한다.
      return [...qa, ...precedent, ...interpretation, ...interestRule, ...groupArea, ...lifeArea];
    } catch (err) {
      logger.warn("easylaw searchLifeLaw failed", { query, err: String(err) });
      return [];
    }
  });
}

/** 2. 생활분야 대분류 목록 (41건) */
export async function listLifeClasses(): Promise<LifeClassItem[]> {
  if (!envReady()) {
    logger.warn("easylaw: env missing (EASYLAW_KEY) — returning []");
    return [];
  }
  return withCache("easylaw:classes", CACHE_TTL_DAY, async () => {
    try {
      const xml = await soapCall(SERVICE_INFO, `<open:getLifeClassList/>`);
      checkReturnCode(xml);
      return xmlItems(xml).map((r) => ({
        id: r.csmAstSeq ?? "",
        name: r.astNm ?? "",
        linkUrl: r.linkUrl ?? "",
        order: r.srtOdr ?? ""
      }));
    } catch (err) {
      logger.warn("easylaw listLifeClasses failed", { err: String(err) });
      return [];
    }
  });
}

/** 3. 생활분야별 콘텐츠 목록 */
export async function listLifeAreas(csmAstSeq: string): Promise<LifeAreaItem[]> {
  if (!envReady()) {
    logger.warn("easylaw: env missing (EASYLAW_KEY) — returning []");
    return [];
  }
  return withCache(`easylaw:areas:${csmAstSeq}`, CACHE_TTL_DAY, async () => {
    try {
      const inner =
        `<open:getLifeAreaList><LifeAreaListRequest>` +
        `<csmAstSeq>${escapeXml(csmAstSeq)}</csmAstSeq>` +
        `</LifeAreaListRequest></open:getLifeAreaList>`;
      const xml = await soapCall(SERVICE_INFO, inner);
      checkReturnCode(xml);
      return xmlItems(xml).map((r) => ({
        csmSeq: r.csmSeq ?? "",
        title: stripTags(r.csmTtl ?? ""),
        summary: stripTags(r.csmNtSum ?? ""),
        note: stripTags(r.csmNt ?? "")
      }));
    } catch (err) {
      logger.warn("easylaw listLifeAreas failed", { csmAstSeq, err: String(err) });
      return [];
    }
  });
}

/** 4. 주요 궁금사항 */
export async function getLifeAskNotices(csmSeq: string): Promise<LifeGenericItem[]> {
  return genericList(
    `easylaw:askNotices:${csmSeq}`,
    "getLifeAskNoticeList",
    `<open:getLifeAskNoticeList><LifeAskNoticeListRequest>` +
      `<csmSeq>${escapeXml(csmSeq)}</csmSeq>` +
      `</LifeAskNoticeListRequest></open:getLifeAskNoticeList>`
  );
}

/** 5. 법령체계도 */
export async function getLifeLawsSystem(csmSeq: string): Promise<LifeGenericItem[]> {
  return genericList(
    `easylaw:lawsSystem:${csmSeq}`,
    "getLifeLawsSystemList",
    `<open:getLifeLawsSystemList><LifeLawsSystemListRequest>` +
      `<csmSeq>${escapeXml(csmSeq)}</csmSeq>` +
      `</LifeLawsSystemListRequest></open:getLifeLawsSystemList>`
  );
}

/** 6. 대법원 판례 */
export async function getLifePrecedents(keys: LifeKeys): Promise<LifeCaseItem[]> {
  return caseList(
    `easylaw:prec:${keys.csmSeq}:${keys.ccfNo}:${keys.cciNo}:${keys.cnpClsNo}`,
    "getLifeSuperMePrecedentList",
    `<open:getLifeSuperMePrecedentList><LifeSuperMePrecedentListRequest>` +
      `${keysXml(keys)}` +
      `</LifeSuperMePrecedentListRequest></open:getLifeSuperMePrecedentList>`,
    "LifeSuperMePrecedentPrecListItems",
    "LifeSuperMePrecedentPrecListItem"
  );
}

/** 7. 행정심판 재결례 */
export async function getLifeAdminReferees(keys: LifeKeys): Promise<LifeCaseItem[]> {
  return caseList(
    `easylaw:adminRef:${keys.csmSeq}:${keys.ccfNo}:${keys.cciNo}:${keys.cnpClsNo}`,
    "getLifeAdminRefereeList",
    `<open:getLifeAdminRefereeList><LifeAdminRefereeListRequest>` +
      `${keysXml(keys)}` +
      `</LifeAdminRefereeListRequest></open:getLifeAdminRefereeList>`,
    "LifeAdminRefereeDeccListItems",
    "LifeAdminRefereeDeccListItem"
  );
}

/** 8. 법령해석례 */
export async function getLifeInterpretations(keys: LifeKeys): Promise<LifeCaseItem[]> {
  return caseList(
    `easylaw:interp:${keys.csmSeq}:${keys.ccfNo}:${keys.cciNo}:${keys.cnpClsNo}`,
    "getLifeLawsInterpretList",
    `<open:getLifeLawsInterpretList><LifeLawsInterpretListRequest>` +
      `${keysXml(keys)}` +
      `</LifeLawsInterpretListRequest></open:getLifeLawsInterpretList>`,
    "LifeLawsInterpretExpcListItems",
    "LifeLawsInterpretExpcListItem"
  );
}

/** 9. 헌재 결정례 */
export async function getLifeConstitutional(keys: LifeKeys): Promise<LifeCaseItem[]> {
  return caseList(
    `easylaw:const:${keys.csmSeq}:${keys.ccfNo}:${keys.cciNo}:${keys.cnpClsNo}`,
    "getLifeConstitutionalCourtList",
    `<open:getLifeConstitutionalCourtList><LifeConstitutionalCourtListRequest>` +
      `${keysXml(keys)}` +
      `</LifeConstitutionalCourtListRequest></open:getLifeConstitutionalCourtList>`,
    "LifeConstitutionalCourtDetcListItems",
    "LifeConstitutionalCourtDetcListItem"
  );
}

/** 10. 관심규정 개요 */
export async function getLifeRuleSummary(keys: LifeKeys): Promise<LifeGenericItem[]> {
  return genericList(
    `easylaw:ruleSummary:${keys.csmSeq}:${keys.ccfNo}:${keys.cciNo}:${keys.cnpClsNo}`,
    "getLifeInterrestRuleSummaryItem",
    `<open:getLifeInterrestRuleSummaryItem><LifeInterrestRuleSummaryItemRequest>` +
      `${keysXml(keys)}` +
      `</LifeInterrestRuleSummaryItemRequest></open:getLifeInterrestRuleSummaryItem>`
  );
}

/** 11. 관심규정 분류 */
export async function getLifeRuleAreaClasses(csmSeq: string): Promise<LifeGenericItem[]> {
  return genericList(
    `easylaw:ruleAreaClasses:${csmSeq}`,
    "getLifeInterrestRuleAreaClassList",
    `<open:getLifeInterrestRuleAreaClassList><LifeInterrestRuleAreaClassListRequest>` +
      `<csmSeq>${escapeXml(csmSeq)}</csmSeq>` +
      `</LifeInterrestRuleAreaClassListRequest></open:getLifeInterrestRuleAreaClassList>`
  );
}

/** 12. 동영상 */
export async function getLifeMovies(): Promise<LifeGenericItem[]> {
  return genericList(
    "easylaw:movies",
    "getLifeMovieInfoList",
    `<open:getLifeMovieInfoList><LifeMovieInfoListRequest>` +
      `</LifeMovieInfoListRequest></open:getLifeMovieInfoList>`
  );
}

/** 13. eBook */
export async function getLifeEbooks(): Promise<LifeGenericItem[]> {
  return genericList(
    "easylaw:ebooks",
    "getLifeEbookInfoList",
    `<open:getLifeEbookInfoList><LifeEbookInfoListRequest>` +
      `</LifeEbookInfoListRequest></open:getLifeEbookInfoList>`
  );
}

/** 14. 판례·재결례·해석례·헌재결정례 묶음 조회 */
export async function getLifeCaseBundle(keys: LifeKeys): Promise<LifeCaseBundle> {
  const safe = async (fn: () => Promise<LifeCaseItem[]>): Promise<LifeCaseItem[]> => {
    try {
      return await fn();
    } catch {
      return [];
    }
  };
  const [precedents, adminReferees, interpretations, constitutional] = await Promise.all([
    safe(() => getLifePrecedents(keys)),
    safe(() => getLifeAdminReferees(keys)),
    safe(() => getLifeInterpretations(keys)),
    safe(() => getLifeConstitutional(keys))
  ]);
  return { precedents, adminReferees, interpretations, constitutional };
}

/* ─────────────────────────────────────────────────────────────
 * Service A — EnglishLifeLawInfoService (영문 생활법령)
 * 외국인 고객 상담 시 영문 자료로 활용.
 * 라이브 실측 (2026-07): 3개 오퍼레이션 모두 페이징 파라미터 없음
 * (nowPageNo/pageMg 를 넣으면 이 API 계열은 HTTP 500).
 * ───────────────────────────────────────────────────────────── */

export type EngAreaItem = {
  csmSeq: string;
  title: string;
  description: string;
  iconUrl: string;
};

export type EngRuleClassItem = {
  csmSeq: string;
  ccfNo: string;
  cciNo: string;
  cnpClsNo: string;
  name: string;
  linkUrl: string;
  fields: Record<string, string>;
};

export type EngContentItem = {
  body: string;
  ruleDesc: string;
  fields: Record<string, string>;
};

/** 상대경로면 easylaw 도메인 기준으로 절대화. 절대 URL 은 그대로 둔다. */
function absolutizeUrl(u: string): string {
  const s = String(u ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `${EASYLAW_SITE}${s.startsWith("/") ? "" : "/"}${s}`;
}

/** 지정 컨테이너로 우선 파싱, 없으면 itemTag 전체 스캔으로 폴백 */
function xmlItemsInOrScan(
  xml: string,
  containerTag: string,
  itemTag: string
): Record<string, string>[] {
  const scoped = xmlItemsIn(xml, containerTag, itemTag);
  if (scoped.length > 0) return scoped;
  return xmlItems(xml, itemTag);
}

async function engCall<T>(
  cacheKey: string,
  operation: string,
  inner: string,
  parse: (xml: string) => T,
  empty: T
): Promise<T> {
  if (!envReady()) {
    logger.warn("easylaw: env missing (EASYLAW_KEY) — returning empty");
    return empty;
  }
  return withCache(cacheKey, CACHE_TTL_DAY, async () => {
    try {
      const xml = await soapCall(SERVICE_ENG, inner);
      checkReturnCode(xml);
      return parse(xml);
    } catch (err) {
      logger.warn("easylaw call failed", { operation, err: String(err) });
      return empty;
    }
  });
}

/** A-1. 영문 생활법령 분야 목록 (파라미터 없음) */
export async function listEnglishAreas(): Promise<EngAreaItem[]> {
  return engCall<EngAreaItem[]>(
    "easylaw:eng:areas",
    "getEngAreaList",
    `<open:getEngAreaList><EngAreaListRequest></EngAreaListRequest></open:getEngAreaList>`,
    (xml) =>
      xmlItemsInOrScan(xml, "EngAreaListItems", "EngAreaListItem").map((r) => ({
        csmSeq: r.csmSeq ?? "",
        title: stripTags(r.csmTtl ?? ""),
        description: normalizeLongText(r.csmNt ?? ""),
        iconUrl: absolutizeUrl(r.iconUrl ?? "")
      })),
    []
  );
}

/** A-2. 영문 관심규정 분류 목록 */
export async function listEnglishRuleClasses(csmSeq: string): Promise<EngRuleClassItem[]> {
  return engCall<EngRuleClassItem[]>(
    `easylaw:eng:ruleClasses:${csmSeq}`,
    "getEngAreaInterrestRuleClassList",
    `<open:getEngAreaInterrestRuleClassList><EngAreaInterrestRuleClassListRequest>` +
      `<csmSeq>${escapeXml(csmSeq)}</csmSeq>` +
      `</EngAreaInterrestRuleClassListRequest></open:getEngAreaInterrestRuleClassList>`,
    (xml) =>
      xmlItemsInOrScan(
        xml,
        "EngAreaInterrestRuleClassListItems",
        "EngAreaInterrestRuleClassListItem"
      ).map((fields) => ({
        csmSeq: fields.csmSeq ?? "",
        ccfNo: fields.ccfNo ?? "",
        cciNo: fields.cciNo ?? "",
        cnpClsNo: fields.cnpClsNo ?? "",
        name: stripTags(fields.nm ?? ""),
        linkUrl: absolutizeUrl(fields.linkUrl ?? ""),
        fields
      })),
    []
  );
}

/** A-3. 영문 콘텐츠 본문 */
export async function getEnglishContent(keys: LifeKeys): Promise<EngContentItem[]> {
  return engCall<EngContentItem[]>(
    `easylaw:eng:content:${keys.csmSeq}:${keys.ccfNo}:${keys.cciNo}:${keys.cnpClsNo}`,
    "getEngAreaContentItem",
    `<open:getEngAreaContentItem><EngAreaContentItemRequest>` +
      `${keysXml(keys)}` +
      `</EngAreaContentItemRequest></open:getEngAreaContentItem>`,
    (xml) =>
      // 미검증: 컨테이너 태그명 추정 (형제 서비스 관례 기준) — 없으면 item 전체 스캔 폴백
      xmlItemsInOrScan(xml, "EngAreaContentItemItems", "EngAreaContentItemItem").map(
        (fields) => ({
          body: normalizeLongText(fields.cnpClsNt ?? ""),
          ruleDesc: normalizeLongText(fields.ruledesc ?? ""),
          fields
        })
      ),
    []
  );
}

/* ─────────────────────────────────────────────────────────────
 * Service B — ManyAskManyAnswerService (백문백답)
 *
 * 주의: lawbot(_easylaw.py:123 search_mqna)은 getMaskMAnswerSearchContentList 를 호출하나
 *       WSDL에 존재하지 않는 오퍼레이션이라 HTTP 500이 난다. 키워드 검색은 없고
 *       분류 → 분야 → 상세 계층 조회만 가능하다. (라이브 WSDL 실측 2026-07)
 *
 * getMaskMAnswerAreaItem 응답에는 파일/법령/생활법령 3개 목록이 공존하므로
 * 반드시 xmlItemsIn 으로 컨테이너를 지정해 파싱한다 (판례 Lk 목록과 동일 사유).
 * ───────────────────────────────────────────────────────────── */

export type MqnaClassItem = {
  onhunqnaAstSeq: string;
  onhunqueAstSeq: string;
  areaName: string;
  categoryName: string;
  fields: Record<string, string>;
};

export type MqnaQaItem = {
  onhunqueSeq: string;
  onhunqnaAstSeq: string;
  question: string;
  answer: string;
  areaName: string;
  categoryName: string;
  subject: string;
  date: string;
};

export type MqnaDetail = {
  files: Array<{ name: string; url: string; ext: string; fields: Record<string, string> }>;
  laws: Array<{ name: string; seq: string }>;
  related: Array<{
    title: string;
    className: string;
    linkUrl: string;
    fields: Record<string, string>;
  }>;
};

async function mqnaCall<T>(
  cacheKey: string,
  operation: string,
  inner: string,
  parse: (xml: string) => T,
  empty: T
): Promise<T> {
  if (!envReady()) {
    logger.warn("easylaw: env missing (EASYLAW_KEY) — returning empty");
    return empty;
  }
  return withCache(cacheKey, CACHE_TTL_DAY, async () => {
    try {
      const xml = await soapCall(SERVICE_MQNA, inner);
      checkReturnCode(xml);
      return parse(xml);
    } catch (err) {
      logger.warn("easylaw call failed", { operation, err: String(err) });
      return empty;
    }
  });
}

/** B-1. 백문백답 분류 목록 (파라미터 없음) */
export async function listMqnaClasses(): Promise<MqnaClassItem[]> {
  return mqnaCall<MqnaClassItem[]>(
    "easylaw:mqna:classes",
    "getMaskMAnswerClassList",
    `<open:getMaskMAnswerClassList/>`,
    (xml) =>
      xmlItems(xml, "MaskMAnswerClassListItem").map((fields) => ({
        onhunqnaAstSeq: fields.onhunqnaAstSeq ?? "",
        onhunqueAstSeq: fields.onhunqueAstSeq ?? "",
        areaName: stripTags(fields.onhunqnaAstNm ?? ""),
        categoryName: stripTags(fields.onhunqueCatNm ?? ""),
        fields
      })),
    []
  );
}

/** B-2. 백문백답 분야별 Q/A 목록 */
export async function listMqnaQa(
  onhunqnaAstSeq: string,
  onhunqueAstSeq: string
): Promise<MqnaQaItem[]> {
  return mqnaCall<MqnaQaItem[]>(
    `easylaw:mqna:qa:${onhunqnaAstSeq}:${onhunqueAstSeq}`,
    "getMaskMAnswerAreaList",
    `<open:getMaskMAnswerAreaList><MaskMAnswerAreaListRequest>` +
      `<onhunqnaAstSeq>${escapeXml(onhunqnaAstSeq)}</onhunqnaAstSeq>` +
      `<onhunqueAstSeq>${escapeXml(onhunqueAstSeq)}</onhunqueAstSeq>` +
      `</MaskMAnswerAreaListRequest></open:getMaskMAnswerAreaList>`,
    (xml) =>
      xmlItems(xml, "MaskMAnswerAreaListItem").map((r) => ({
        onhunqueSeq: r.onhunqueSeq ?? "",
        onhunqnaAstSeq: r.onhunqnaAstSeq ?? "",
        question: normalizeLongText(r.onhunqueCts ?? ""),
        answer: normalizeLongText(r.onhunansCts ?? ""),
        areaName: stripTags(r.onhunqnaAstNm ?? ""),
        categoryName: stripTags(r.onhunqueCatNm ?? ""),
        subject: stripTags(r.onhunqueSubjNm ?? ""),
        date: r.onhunansServiceDt ?? ""
      })),
    []
  );
}

/** B-3. 백문백답 상세 — 첨부파일 / 관련 법령 / 관련 생활법령 3개 병렬 목록 */
export async function getMqnaDetail(
  onhunqnaAstSeq: string,
  onhunqueSeq: string
): Promise<MqnaDetail> {
  const empty: MqnaDetail = { files: [], laws: [], related: [] };
  return mqnaCall<MqnaDetail>(
    `easylaw:mqna:detail:${onhunqnaAstSeq}:${onhunqueSeq}`,
    "getMaskMAnswerAreaItem",
    `<open:getMaskMAnswerAreaItem><MaskMAnswerAreaItemRequest>` +
      `<onhunqnaAstSeq>${escapeXml(onhunqnaAstSeq)}</onhunqnaAstSeq>` +
      `<onhunqueSeq>${escapeXml(onhunqueSeq)}</onhunqueSeq>` +
      `</MaskMAnswerAreaItemRequest></open:getMaskMAnswerAreaItem>`,
    (xml) => ({
      files: xmlItemsIn(
        xml,
        "MaskMAnswerAreaFileListItems",
        "MaskMAnswerAreaFileListItem"
      ).map((fields) => {
        const composed = fields.flPth
          ? `${fields.flPth}${fields.flPth.endsWith("/") ? "" : "/"}${fields.flNm ?? ""}`
          : "";
        return {
          name: stripTags(fields.flNm ?? ""),
          url: absolutizeUrl(fields.linkUrl || composed),
          ext: fields.flExt ?? "",
          fields
        };
      }),
      laws: xmlItemsIn(xml, "MaskMAnswerAreaLawListItems", "MaskMAnswerAreaLawListItem").map(
        (r) => ({
          name: stripTags(r.onhunqueConLsiNm ?? ""),
          seq: r.onhunqueConLsiSeq ?? ""
        })
      ),
      related: xmlItemsIn(
        xml,
        "MaskMAnswerAreaInfoListItems",
        "MaskMAnswerAreaInfoListItem"
      ).map((fields) => ({
        title: stripTags(fields.csmTtl || fields.ccfTtl || ""),
        className: stripTags(fields.cnpClsNm ?? ""),
        linkUrl: absolutizeUrl(fields.linkUrl ?? ""),
        fields
      }))
    }),
    empty
  );
}
