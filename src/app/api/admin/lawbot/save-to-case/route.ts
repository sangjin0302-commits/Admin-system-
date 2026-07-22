import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

/**
 * lawbot AI 분석 결과를 특정 사건에 CaseEvent로 저장.
 * /api/admin/* — 미들웨어 Basic Auth 보호.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });

  const caseId = typeof body.caseId === "string" ? body.caseId : "";
  const analysis = body.analysis;
  if (!caseId || !analysis || typeof analysis !== "object") {
    return NextResponse.json({ ok: false, error: "사건과 분석 결과가 필요합니다." }, { status: 400 });
  }

  try {
    const caseMatter = await prisma.caseMatter.findUnique({ where: { id: caseId }, select: { id: true } });
    if (!caseMatter) return NextResponse.json({ ok: false, error: "사건을 찾을 수 없습니다." }, { status: 404 });

    const summary = typeof analysis.summary === "string" ? analysis.summary : "AI 분석 결과";
    const domain = typeof analysis.domain === "string" ? analysis.domain : "";
    const message = `AI 분석 저장${domain ? ` [${domain}]` : ""}: ${summary}`.slice(0, 500);

    await prisma.caseEvent.create({
      data: {
        caseId,
        eventType: "lawbot_analysis",
        actorName: "관리자 (AI 분석)",
        message,
        payloadJson: JSON.stringify(analysis).slice(0, 12000)
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/lawbot/save-to-case POST failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
