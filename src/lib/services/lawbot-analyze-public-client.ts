/**
 * Lawbot `/analyze` (공개용) 호출 클라이언트.
 *
 * 관리자용(`/analyze/admin`)과 의도적으로 분리한다:
 *
 *  | 구분 | 엔드포인트 | 토큰 | 입력 상한 | 횟수 제한 |
 *  |---|---|---|---|---|
 *  | 관리자 | `/analyze/admin` | x-lawbot-token 필수 | 8000자 | 없음 |
 *  | 고객   | `/analyze`       | **토큰 안 보냄**    | 4000자 | 봇에서 일 5회 |
 *
 * 🔴 이 파일에서 절대 하지 말 것:
 *   1. LAWBOT_ANALYZE_TOKEN 을 헤더에 싣지 말 것 — 실으면 고객 요청이 관리자
 *      권한으로 올라가 일일 제한이 풀리고 8000자 경로가 열린다.
 *   2. `/analyze/admin` 으로 URL을 만들지 말 것 — 아래 toPublicUrl()이 강제로
 *      `/analyze` 로 되돌린다.
 *
 * URL 결정 순서:
 *   LAWBOT_ANALYZE_PUBLIC_URL (있으면 그대로)
 *   → 없으면 LAWBOT_ANALYZE_URL 에서 admin 경로를 벗겨 공개 경로로 변환
 */

import { logger } from "@/lib/utils/logger";

/** 봇이 공개 경로에 거는 입력 상한과 동일하게 맞춘다(초과분은 보내기 전에 컷). */
export const PUBLIC_ANALYZE_MAX_INPUT = 4000;

export type PublicAnalyzeOutcome =
  | { status: "ok"; data: PublicAnalyzeRaw }
  | { status: "not_configured" }
  | { status: "rate_limited" }
  | { status: "error"; reason: string };

/** 봇 PublicAnalysisResponse 중 고객에게 쓸 필드만. */
export type PublicAnalyzeRaw = {
  input_summary?: unknown;
  key_issues?: unknown;
  followup_facts?: unknown;
  applicable_laws?: unknown;
  risk_flags?: unknown;
};

/** `/analyze/admin` → `/analyze` 로 강제 변환. 관리자 경로 유출 방지. */
export function toPublicAnalyzeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (trimmed.endsWith("/analyze/admin")) {
    return trimmed.slice(0, -"/admin".length);
  }
  if (trimmed.endsWith("/analyze")) {
    return trimmed;
  }
  // 베이스 URL만 준 경우
  return `${trimmed}/analyze`;
}

function resolvePublicUrl(): string | null {
  const explicit = process.env.LAWBOT_ANALYZE_PUBLIC_URL?.trim();
  if (explicit) return toPublicAnalyzeUrl(explicit);

  const adminUrl = process.env.LAWBOT_ANALYZE_URL?.trim();
  if (adminUrl) return toPublicAnalyzeUrl(adminUrl);

  return null;
}

export function isPublicAnalyzeConfigured(): boolean {
  return resolvePublicUrl() !== null;
}

export async function analyzePublic(factInput: string): Promise<PublicAnalyzeOutcome> {
  const url = resolvePublicUrl();
  if (!url) return { status: "not_configured" };

  const timeoutMs = Number(process.env.LAWBOT_ANALYZE_TIMEOUT_MS ?? "50000");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      // 토큰 헤더 없음 — 의도적. 위 주석 참고.
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ fact_input: factInput.slice(0, PUBLIC_ANALYZE_MAX_INPUT) }),
      cache: "no-store",
      signal: controller.signal
    });

    if (response.status === 429) {
      return { status: "rate_limited" };
    }
    if (!response.ok) {
      logger.warn("[lawbot-public-analyze] upstream error", response.status);
      return { status: "error", reason: `http_${response.status}` };
    }

    const data = (await response.json()) as PublicAnalyzeRaw;
    return { status: "ok", data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { status: "error", reason: "timeout" };
    }
    logger.warn("[lawbot-public-analyze] exception", error);
    return { status: "error", reason: "exception" };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── 응답 정규화 (고객 노출용 화이트리스트) ──────────────────────────────

function asStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, limit);
}

/** `applicable_laws` 는 { law, summary } 배열. 고객에게는 법령명만 준다(본문·요지 미노출). */
export function extractApplicableLawNames(value: unknown, limit = 5): string[] {
  if (!Array.isArray(value)) return [];
  const names: string[] = [];
  for (const item of value) {
    if (item && typeof item === "object" && typeof (item as { law?: unknown }).law === "string") {
      const law = (item as { law: string }).law.trim();
      if (law) names.push(law);
    }
    if (names.length >= limit) break;
  }
  return names;
}

/**
 * 고객 화면에 내려도 되는 필드만 골라낸다.
 *
 * 제외 대상(실무자 전략이라 공개 금지): pros / cons / argument_strategy /
 * counter_argument_points / matched_* / analysis_mode / 판례·해석례 원문.
 */
export function toPublicQuickCheckPayload(raw: PublicAnalyzeRaw) {
  return {
    summary: typeof raw.input_summary === "string" ? raw.input_summary : null,
    keyIssues: asStringArray(raw.key_issues, 5),
    followupFacts: asStringArray(raw.followup_facts, 5),
    riskFlags: asStringArray(raw.risk_flags, 5),
    applicableLawNames: extractApplicableLawNames(raw.applicable_laws, 5)
  };
}
