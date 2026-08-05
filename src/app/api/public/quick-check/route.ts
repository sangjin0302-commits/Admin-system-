import { NextResponse } from "next/server";

import {
  analyzePublic,
  isPublicAnalyzeConfigured,
  toPublicQuickCheckPayload
} from "@/lib/services/lawbot-analyze-public-client";
import { extractLawNames, buildLawDeeplink } from "@/lib/services/law-deeplink";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { logger } from "@/lib/utils/logger";
import { isAiAllowed } from "@/lib/services/ai-budget-guard";

export const maxDuration = 60;

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

  // 미설정이면 오류 대신 "준비 중"으로 명확히 알린다.
  // (브릿지 시절엔 미설정도 503 "일시적 오류"로 나가 고객이 계속 재시도했다.)
  if (!isPublicAnalyzeConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_configured",
        error: "AI 사전 진단은 현재 준비 중입니다. 상담 신청을 이용해 주세요."
      },
      { status: 503 }
    );
  }

  // AI 비용 방어 — 마스터 킬/월 예산 초과 시 상류(Anthropic) 호출 전에 거부.
  const aiGate = await isAiAllowed();
  if (!aiGate.ok) {
    logger.warn("[public/quick-check] AI budget guard blocked request", { reason: aiGate.reason });
    return NextResponse.json(
      {
        ok: false,
        code: "ai_disabled",
        error: "AI 사전 진단은 현재 일시적으로 비활성화되었습니다. 상담 신청을 이용해 주세요."
      },
      { status: 503 }
    );
  }

  // Lawbot 공개 엔드포인트(/analyze) 호출 — 관리자 토큰을 싣지 않는다.
  // 봇 쪽에도 일 5회 제한이 걸려 있고, 위의 IP 레이트리밋(5분 5회)이 1차 방어다.
  const requestId = `qc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const outcome = await analyzePublic(fact);

  if (outcome.status === "rate_limited") {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        error: "무료 사전 진단 한도(1일 5회)를 모두 사용하셨습니다. 내일 다시 이용하시거나 상담을 신청해 주세요."
      },
      { status: 429 }
    );
  }
  if (outcome.status !== "ok") {
    logger.warn("[public/quick-check] analyze failed", outcome);
    return NextResponse.json(
      { ok: false, code: "upstream_error", error: "분석 서비스에 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 503 }
    );
  }

  const payload = toPublicQuickCheckPayload(outcome.data);

  // 법령 인용 — 고객이 입력한 문장에서 뽑은 것 + 봇이 지목한 적용 법령명.
  // 법령 "본문"은 싣지 않는다(참고자료 수준 유지, public-law-search-service 정책과 동일).
  const citationNames = [...extractLawNames(fact), ...payload.applicableLawNames];
  const citations = Array.from(new Set(citationNames)).map((name) => ({
    name,
    url: buildLawDeeplink(name)
  }));

  return NextResponse.json({
    ok: true,
    requestId,
    summary: payload.summary,
    keyIssues: payload.keyIssues,
    followupFacts: payload.followupFacts,
    riskFlags: payload.riskFlags,
    // 사전 진단은 언제나 사람 검토가 필요하다는 점을 응답에 고정한다.
    reviewRequired: true,
    citations
  });
}
