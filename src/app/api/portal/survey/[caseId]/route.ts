import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";
import { requirePortalUser } from "@/lib/security/portal-auth";

const SETTING_PREFIX = "portal.survey.";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const enabled = await isFeatureEnabled("portal_survey_page");
    if (!enabled) {
      return NextResponse.json({ error: "기능이 비활성화되었습니다" }, { status: 404 });
    }

    // 인증 필수. 예전에는 caseId 만 알면(또는 찍어 맞히면) 누구나 남의 사건에
    // NPS 점수·별점·자유의견을 남길 수 있어 만족도 지표를 오염시킬 수 있었다.
    const authed = await requirePortalUser();
    if (authed instanceof NextResponse) return authed;

    const { caseId } = await params;
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "요청 본문을 확인해 주세요" }, { status: 400 });
    }
    const rating = Number(body.rating);
    const npsScore = Number(body.npsScore);
    const feedback = String(body.feedback ?? "").slice(0, 2000);

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "별점(1-5)이 유효하지 않습니다" }, { status: 400 });
    }
    if (!Number.isFinite(npsScore) || npsScore < 0 || npsScore > 10) {
      return NextResponse.json({ error: "추천의향(0-10)이 유효하지 않습니다" }, { status: 400 });
    }

    const caseMatter = await prisma.caseMatter.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        inquiryId: true,
        inquiry: { select: { email: true } },
        parties: { select: { email: true } },
      },
    });
    if (!caseMatter) {
      return NextResponse.json({ error: "사건을 찾을 수 없습니다" }, { status: 404 });
    }

    // 본인 사건인지 확인 — 문의 접수 이메일 또는 사건 당사자 이메일과 일치해야 한다.
    const myEmail = authed.email.trim().toLowerCase();
    const ownerEmails = [
      caseMatter.inquiry?.email,
      ...caseMatter.parties.map((p) => p.email),
    ]
      .filter((e): e is string => !!e)
      .map((e) => e.trim().toLowerCase());
    if (!ownerEmails.includes(myEmail)) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const settingKey = `${SETTING_PREFIX}${caseId}`;
    const existing = await prisma.siteSetting.findUnique({ where: { key: settingKey } });
    if (existing?.value) {
      return NextResponse.json({ error: "이미 제출된 설문입니다" }, { status: 409 });
    }

    const submittedAt = new Date().toISOString();
    const payload = { caseId, rating, npsScore, feedback, submittedAt };

    // Primary: SatisfactionSurvey model
    let savedTo = "SatisfactionSurvey";
    try {
      await prisma.satisfactionSurvey.create({
        data: {
          caseId,
          inquiryId: caseMatter.inquiryId ?? undefined,
          score: npsScore,
          feedback: `[별점 ${rating}/5] ${feedback}`.trim(),
          status: "COMPLETED",
          token: randomBytes(16).toString("hex"),
          completedAt: new Date(),
        },
      });
    } catch (err) {
      logger.warn("[portal-survey] SatisfactionSurvey save failed, falling back", err);
      savedTo = "SiteSetting";
    }

    // Always mirror to SiteSetting for duplicate-prevention + rating retention
    await prisma.siteSetting.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: JSON.stringify(payload) },
      update: { value: JSON.stringify(payload) },
    });

    return NextResponse.json({ ok: true, savedTo });
  } catch (err) {
    logger.error("[portal-survey] submit error", err);
    return NextResponse.json({ error: "제출 실패" }, { status: 500 });
  }
}
