import { NextResponse } from "next/server";

import {
  createLawbotBridgeHttpClientFromEnv,
  LawbotBridgeError
} from "@/lib/services/lawbot-bridge-http-client";
import { buildCitationsFromLawbotSources, extractLawNames, buildLawDeeplink } from "@/lib/services/law-deeplink";
import { logger } from "@/lib/utils/logger";

/**
 * 관리자 전용 lawbot 분석 콘솔.
 * /api/admin/* 이므로 미들웨어 Basic Auth로 보호됨.
 * 공개 quick-check와 달리 실무자용 전체 필드를 반환한다.
 */
export const maxDuration = 30;

export async function POST(request: Request) {
  let body: { fact?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const fact = (body.fact ?? "").trim();
  if (fact.length < 10) {
    return NextResponse.json({ ok: false, error: "사안 내용을 10자 이상 입력해 주세요." }, { status: 400 });
  }
  if (fact.length > 6000) {
    return NextResponse.json({ ok: false, error: "사안은 최대 6000자까지 입력 가능합니다." }, { status: 400 });
  }

  try {
    const client = createLawbotBridgeHttpClientFromEnv();
    const requestId = `admin-qc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const response = await client.intakeAnalyze({ requestId, factInput: fact });

    const mustVerifyArr = response.must_verify ?? [];
    const sourcesArr = response.must_verify_sources ?? [];
    const factCitations = extractLawNames(fact).map((name) => ({ name, url: buildLawDeeplink(name) }));
    const sourceCitations = buildCitationsFromLawbotSources([...mustVerifyArr, ...sourcesArr]);
    const citations = Array.from(
      new Map([...factCitations, ...sourceCitations].map((c) => [c.name, c])).values()
    );

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
      citations
    });
  } catch (error) {
    logger.error("[admin/lawbot/analyze] error", error);
    if (error instanceof LawbotBridgeError) {
      return NextResponse.json(
        { ok: false, error: "lawbot 브릿지 오류. 환경변수(LAWBOT_BRIDGE_BASE_URL 등) 설정을 확인하세요." },
        { status: 503 }
      );
    }
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json(
        { ok: false, error: "lawbot 연동이 아직 설정되지 않았습니다 (LAWBOT_BRIDGE_BASE_URL / LAWBOT_SERVICE_KEY / LAWBOT_SERVICE_CALLER)." },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: false, error: "분석에 실패했습니다." }, { status: 500 });
  }
}
