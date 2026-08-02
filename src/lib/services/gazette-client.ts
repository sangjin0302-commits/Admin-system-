/**
 * 관보(官報) 목록 조회 클라이언트.
 *
 * 데이터 출처: Gwanbo-bot (별도 private repo, FastAPI+Postgres, 행안부 관보 수집).
 * ETHOS 는 그 봇의 **읽기 API** 를 fetch 해서 /gazette 게시판에 표시만 한다.
 *
 * 🔴 전제: 관보봇에 `GET /gazette` 읽기 엔드포인트가 있어야 한다(2026-08 기준 미구현).
 *   봇에 엔드포인트를 추가한 뒤, Vercel env `GWANBO_API_URL` 에 그 URL을 넣으면
 *   이 게시판이 자동으로 채워진다. env 없으면 status="not_configured" → 안내 문구만.
 *
 * URL 결정:
 *   GWANBO_API_URL 이 `/gazette` 로 끝나면 그대로, 아니면 base 로 보고 `/gazette` 를 붙인다.
 *   (봇이 인증을 요구하면 GWANBO_API_TOKEN 을 Bearer 로 실어 보낸다 — 선택.)
 *
 * 응답 계약(느슨하게 허용):
 *   - 배열 그대로: `[ {...}, {...} ]`
 *   - 래핑: `{ items: [...] , total?: number }` / `{ data: [...] }` / `{ results: [...] }`
 *   각 항목 필드는 여러 이름을 폴백으로 받는다(아래 normalizeItem 참고).
 */

import { logger } from "@/lib/utils/logger";

/** 게시판에 뿌리는 정규화된 관보 1건. */
export type GazetteItem = {
  /** 안정적 키(중복 방지). id → url → title+date 순으로 확보. */
  id: string;
  /** 제목/안건명. */
  title: string;
  /** 발령/게시 기관(부처·청). 없으면 빈 문자열. */
  agency: string;
  /** 구분(법률·대통령령·고시·공고 등). 없으면 빈 문자열. */
  category: string;
  /** 게시일 ms(정렬용). 파싱 실패 시 0. */
  dateMs: number;
  /** 원본 링크(관보 상세/PDF). 없으면 null. */
  url: string | null;
  /** 요약/발췌. 없으면 빈 문자열. */
  summary: string;
};

export type GazetteOutcome =
  | { status: "ok"; items: GazetteItem[]; total: number }
  | { status: "not_configured" }
  | { status: "error"; reason: string };

/**
 * GWANBO_API_URL 을 관보봇의 실제 읽기 엔드포인트 `/items/latest` 로 정규화.
 *
 * 봇(Gwanbo-bot FastAPI)은 `GET /items/latest`(최신 10건, list[GazetteItemRead])를
 * 제공한다. `/gazette` 는 없다. base·구 `/gazette` 경로·이미 올바른 경로 모두 흡수.
 */
export function toGazetteUrl(rawUrl: string): string {
  let t = rawUrl.trim().replace(/\/+$/, "");
  if (t.endsWith("/items/latest")) return t;
  if (t.endsWith("/gazette")) t = t.slice(0, -"/gazette".length); // 구 설정 보정
  return `${t}/items/latest`;
}

function resolveGazetteUrl(): string | null {
  const raw = process.env.GWANBO_API_URL?.trim();
  if (!raw) return null;
  return toGazetteUrl(raw);
}

export function isGazetteConfigured(): boolean {
  return resolveGazetteUrl() !== null;
}

/** 문자열·number(초/ms) 어떤 형태든 ms 로. 실패 시 0. */
function toDateMs(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    // 10자리(초)면 ms 로 승격, 그 이상이면 이미 ms 로 본다.
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === "string" && value.trim()) {
    const t = Date.parse(value.trim());
    if (!Number.isNaN(t)) return t;
    // 'YYYYMMDD' 형태(관보 흔한 표기) 보정.
    const m = value.trim().match(/^(\d{4})[.\-/]?(\d{2})[.\-/]?(\d{2})$/);
    if (m) {
      const t2 = Date.parse(`${m[1]}-${m[2]}-${m[3]}`);
      if (!Number.isNaN(t2)) return t2;
    }
  }
  return 0;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

/** 봇 응답 1건 → GazetteItem. 필드명이 달라도 여러 후보로 흡수. */
function normalizeItem(raw: unknown, index: number): GazetteItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const title = pickString(o, ["title", "subject", "name", "안건명", "제목"]);
  if (!title) return null; // 제목 없는 항목은 버린다.

  // original_url = Gwanbo-bot(GazetteItemRead) 실제 필드.
  const url = pickString(o, ["original_url", "url", "link", "href", "detailUrl", "pdfUrl", "원문링크"]) || null;
  const dateMs = toDateMs(
    o.publication_date ?? o.publishedAt ?? o.published_at ?? o.date ?? o.publishedDate ?? o.published_date ?? o.게시일 ?? o.발령일
  );
  const id =
    pickString(o, ["id", "uid", "gazetteId", "관보호수", "seq"]) ||
    url ||
    `${title}-${dateMs || index}`;

  return {
    id,
    title,
    // issuing_agency = 봇 필드. category 는 봇에 동명 존재.
    agency: pickString(o, ["issuing_agency", "agency", "department", "ministry", "기관", "부처", "발령기관"]),
    category: pickString(o, ["category", "type", "section", "구분", "종류"]),
    dateMs,
    url,
    summary: pickString(o, ["summary", "excerpt", "description", "content", "요약", "본문"]),
  };
}

/** 응답 몸통에서 항목 배열을 꺼낸다(배열 그대로 / items / data / results). */
function extractArray(body: unknown): { arr: unknown[]; total: number | null } {
  if (Array.isArray(body)) return { arr: body, total: null };
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    for (const key of ["items", "data", "results", "gazettes"]) {
      if (Array.isArray(o[key])) {
        const total = typeof o.total === "number" ? o.total : null;
        return { arr: o[key] as unknown[], total };
      }
    }
  }
  return { arr: [], total: null };
}

/**
 * 봇 응답 몸통 → 정규화·정렬된 GazetteItem[]. 네트워크와 분리(테스트 가능).
 * 배열/{items}/{data}/{results} 모두 허용하고, 제목 없는 항목은 버린다.
 */
export function normalizeGazetteResponse(body: unknown, limit = 60): GazetteItem[] {
  const { arr } = extractArray(body);
  return arr
    .map((r, i) => normalizeItem(r, i))
    .filter((x): x is GazetteItem => x !== null)
    .sort((a, b) => b.dateMs - a.dateMs)
    .slice(0, limit);
}

/**
 * 관보 목록 조회.
 * @param limit 최대 건수(기본 60). 봇이 지원하면 쿼리로도 전달.
 */
export async function fetchGazetteList(limit = 60): Promise<GazetteOutcome> {
  const base = resolveGazetteUrl();
  if (!base) return { status: "not_configured" };

  const url = `${base}?limit=${encodeURIComponent(String(limit))}`;
  const timeoutMs = Number(process.env.GWANBO_API_TIMEOUT_MS ?? "8000");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.GWANBO_API_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn("[gazette] upstream error", response.status);
      return { status: "error", reason: `http_${response.status}` };
    }

    const body = (await response.json()) as unknown;
    const { total } = extractArray(body);
    const items = normalizeGazetteResponse(body, limit);

    return { status: "ok", items, total: total ?? items.length };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { status: "error", reason: "timeout" };
    }
    logger.warn("[gazette] exception", error);
    return { status: "error", reason: "exception" };
  } finally {
    clearTimeout(timeoutId);
  }
}
