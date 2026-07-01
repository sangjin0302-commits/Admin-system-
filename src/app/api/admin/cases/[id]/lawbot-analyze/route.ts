import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import {
  requireRole,
  logAdminAudit,
  ipFromRequest,
} from "@/lib/services/admin-rbac-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.cases.lawbot-analyze");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF"]);
  if (!guard.ok) return guard.response;

  const { id: caseId } = await ctx.params;
  const caseMatter = await prisma.caseMatter
    .findUnique({ where: { id: caseId }, select: { id: true, title: true } })
    .catch(() => null);
  if (!caseMatter) {
    return api.error(404, "사건을 찾지 못했습니다.", { code: "CASE_NOT_FOUND" });
  }

  const hasBridge = !!(
    process.env.LAWBOT_BRIDGE_BASE_URL &&
    process.env.LAWBOT_SERVICE_KEY &&
    process.env.LAWBOT_SERVICE_CALLER
  );

  if (!hasBridge) {
    await prisma.caseAnalysisRun.create({
      data: {
        caseId,
        runType: "manual",
        status: "SKIPPED",
        errorMessage: "lawbot bridge 미설정",
      },
    });
    return NextResponse.json({
      ok: true,
      status: "SKIPPED",
      reason: "lawbot bridge 미설정",
    });
  }

  try {
    const baseUrl = process.env.LAWBOT_BRIDGE_BASE_URL!.replace(/\/+$/, "");
    // SSRF 방어: https 스킴 강제 (localhost dev 예외)
    if (!baseUrl.startsWith("https://") && !baseUrl.startsWith("http://localhost") && !baseUrl.startsWith("http://127.")) {
      return NextResponse.json({ ok: false, error: "Invalid LAWBOT_BRIDGE_BASE_URL scheme" }, { status: 500 });
    }
    const res = await fetch(`${baseUrl}/analyze/case`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Key": process.env.LAWBOT_SERVICE_KEY!,
        "X-Service-Caller": process.env.LAWBOT_SERVICE_CALLER!,
      },
      body: JSON.stringify({
        caseId: caseMatter.id,
        caseTitle: caseMatter.title,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      await prisma.caseAnalysisRun.create({
        data: {
          caseId,
          runType: "manual",
          status: "FAILED",
          errorMessage: `bridge ${res.status}`,
        },
      });
      return api.error(502, `Lawbot bridge 오류 (${res.status})`, {
        code: "LAWBOT_BRIDGE_ERROR",
      });
    }

    const data = (await res.json()) as {
      strengthScore?: number;
      strengthLabel?: string;
      recommendation?: string;
    };

    const run = await prisma.caseAnalysisRun.create({
      data: {
        caseId,
        runType: "manual",
        status: "COMPLETED",
        strengthScore: data.strengthScore,
        strengthLabel: data.strengthLabel,
        recommendation: data.recommendation,
        rawJson: JSON.stringify(data).slice(0, 4000),
        completedAt: new Date(),
      },
    });

    await logAdminAudit({
      actorEmail: guard.user.email,
      actorRole: guard.user.role,
      action: "UPDATE",
      resource: "CaseAnalysisRun",
      resourceId: run.id,
      details: { caseId, runType: "manual", strengthScore: data.strengthScore },
      ip: ipFromRequest(req),
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ ok: true, status: "COMPLETED", run });
  } catch (err) {
    await prisma.caseAnalysisRun.create({
      data: {
        caseId,
        runType: "manual",
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "unknown",
      },
    });
    return api.error(500, "분석 실패", { code: "LAWBOT_ANALYZE_FAILED" });
  }
}
