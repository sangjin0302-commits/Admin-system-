import { NextResponse } from "next/server";

import { createLawbotBridgeHttpClientFromEnv, LawbotBridgeError } from "@/lib/services/lawbot-bridge-http-client";
import { buildCitationsFromLawbotSources, extractLawNames, buildLawDeeplink } from "@/lib/services/law-deeplink";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { logger } from "@/lib/utils/logger";

export const maxDuration = 30;

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 min
const RATE_LIMIT_MAX = 5;                    // 5 requests / 5 min / IP
const MAX_BODY_BYTES = 8 * 1024;

type Body = {
  fact: string;
  category?: string;
};

export async function POST(request: Request) {
  // rate limit
  const ip = getClientIpFromHeaders(request.headers) ?? "unknown";
  const rl = consumeRateLimit({
    namespace: "public:quick-check",
    key: ip,
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  // body
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "입력이 너무 깁니다." }, { status: 413 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const fact = (body.fact ?? "").trim();
  if (fact.length < 10) {
    return NextResponse.json(
      { ok: false, error: "사안 내용을 10자 이상 입력해 주세요." },
      { status: 400 }
    );
  }
  if (fact.length > 3000) {
    return NextResponse.json(
      { ok: false, error: "사안은 최대 3000자까지 입력 가능합니다." },
      { status: 400 }
    );
  }

  // lawbot 호출
  try {
    const client = createLawbotBridgeHttpClientFromEnv();
    const requestId = `qc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const response = await client.intakeAnalyze({
      requestId,
      factInput: fact
    });

    // 법령 인용 자동 추출
    const mustVerifyArr = response.must_verify ?? [];
    const sourcesArr = response.must_verify_sources ?? [];
    const factCitationNames = extractLawNames(fact);
    const factCitations = factCitationNames.map((name) => ({
      name,
      url: buildLawDeeplink(name)
    }));
    const sourceCitations = buildCitationsFromLawbotSources([...mustVerifyArr, ...sourcesArr]);
    const allCitations = [...factCitations, ...sourceCitations];
    const dedupedCitations = Array.from(
      new Map(allCitations.map((c) => [c.name, c])).values()
    );

    // 공개용 안전 응답 — 민감 필드 제외
    return NextResponse.json({
      ok: true,
      requestId,
      summary: response.intake_summary ?? null,
      domain: response.domain ?? null,
      scope: response.scope ?? null,
      reviewRequired: response.review_required ?? true,
      mustVerify: mustVerifyArr,
      riskFlags: response.risk_flags ?? [],
      caseOutlook: response.case_outlook ?? null,
      practitionerGuide: response.practitioner_guide ?? null,
      matchedSubtypes: response.matched_subtype_keys ?? [],
      citations: dedupedCitations
    });
  } catch (error) {
    logger.error("[public/quick-check] lawbot error", error);
    if (error instanceof LawbotBridgeError) {
      return NextResponse.json(
        { ok: false, error: "분석 서비스에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "분석에 실패했습니다." },
      { status: 500 }
    );
  }
}
