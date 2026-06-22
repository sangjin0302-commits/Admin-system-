import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/cases/[id]/lawbot-analyze/export
 *   사건의 모든 CaseAnalysisRun을 JSON 또는 CSV로 다운로드.
 *   format=json (default) | csv
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.cases.lawbot.export");
  const guard = await requireRole(req, ["SUPER", "MANAGER", "STAFF", "AUDITOR"]);
  if (!guard.ok) return guard.response;

  const { id: caseId } = await ctx.params;
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();

  const runs = await prisma.caseAnalysisRun
    .findMany({
      where: { caseId },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  if (format === "csv") {
    const header = [
      "createdAt",
      "completedAt",
      "runType",
      "status",
      "strengthScore",
      "strengthLabel",
      "recommendation",
      "errorMessage",
    ].join(",");
    const esc = (v: unknown): string => {
      const s = v === null || v === undefined ? "" : String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const lines = runs.map((r) =>
      [
        r.createdAt.toISOString(),
        r.completedAt?.toISOString() ?? "",
        r.runType,
        r.status,
        r.strengthScore ?? "",
        r.strengthLabel ?? "",
        r.recommendation ?? "",
        r.errorMessage ?? "",
      ]
        .map(esc)
        .join(",")
    );
    const csv = "﻿" + [header, ...lines].join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lawbot-${caseId}-${Date.now()}.csv"`,
        "X-Admin-Request-Id": api.requestId,
      },
    });
  }

  // JSON
  return NextResponse.json({
    ok: true,
    caseId,
    count: runs.length,
    runs: runs.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
  });
}
