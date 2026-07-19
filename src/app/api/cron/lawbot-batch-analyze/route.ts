/**
 * Vercel Cron — 활성 사건에 대해 lawbot 분석 배치 실행 (1일 1회 권장).
 *
 * - 최근 7일 내 업데이트된 OPEN/INVESTIGATING/PREPARING 상태 사건
 * - 마지막 분석으로부터 24h 경과한 사건만
 * - CaseAnalysisRun 모델에 결과 영속화
 * - lawbot bridge 미설정 시 SKIPPED로만 기록
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOOKBACK_DAYS = 7;
const RERUN_HOURS = 24;
const BATCH_LIMIT = 30;

async function lawbotBridgeAvailable(): Promise<boolean> {
  return !!(
    process.env.LAWBOT_BRIDGE_BASE_URL &&
    process.env.LAWBOT_SERVICE_KEY &&
    process.env.LAWBOT_SERVICE_CALLER
  );
}

async function analyzeCase(caseId: string, caseTitle: string): Promise<{
  ok: boolean;
  strengthScore?: number;
  strengthLabel?: string;
  recommendation?: string;
  raw?: unknown;
  error?: string;
}> {
  if (!(await lawbotBridgeAvailable())) {
    return { ok: false, error: "lawbot bridge 미설정" };
  }

  try {
    const baseUrl = process.env.LAWBOT_BRIDGE_BASE_URL!.replace(/\/+$/, "");
    const res = await fetch(`${baseUrl}/analyze/case`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Key": process.env.LAWBOT_SERVICE_KEY!,
        "X-Service-Caller": process.env.LAWBOT_SERVICE_CALLER!,
      },
      body: JSON.stringify({ caseId, caseTitle }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { ok: false, error: `bridge ${res.status}` };
    }
    const data = (await res.json()) as {
      strengthScore?: number;
      strengthLabel?: string;
      recommendation?: string;
    };
    return {
      ok: true,
      strengthScore: data.strengthScore,
      strengthLabel: data.strengthLabel,
      recommendation: data.recommendation,
      raw: data,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  // 시크릿이 비어 있으면 예전 코드는 검사 자체를 건너뛰어 누구나 실행할 수 있었다.
  // 미설정이면 무조건 거부한다.
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400_000);
  const rerunCutoff = new Date(Date.now() - RERUN_HOURS * 3600_000);

  const candidates = await prisma.caseMatter
    .findMany({
      where: {
        updatedAt: { gte: since },
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: BATCH_LIMIT,
    })
    .catch(() => []);

  let analyzed = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of candidates) {
    const recent = await prisma.caseAnalysisRun
      .findFirst({
        where: { caseId: c.id, createdAt: { gte: rerunCutoff } },
        select: { id: true },
      })
      .catch(() => null);
    if (recent) {
      skipped++;
      continue;
    }

    const result = await analyzeCase(c.id, c.title);

    if (result.ok) {
      await prisma.caseAnalysisRun
        .create({
          data: {
            caseId: c.id,
            runType: "scheduled",
            status: "COMPLETED",
            strengthScore: result.strengthScore,
            strengthLabel: result.strengthLabel,
            recommendation: result.recommendation,
            rawJson: result.raw
              ? JSON.stringify(result.raw).slice(0, 4000)
              : null,
            completedAt: new Date(),
          },
        })
        .catch(() => undefined);
      analyzed++;
    } else if (result.error === "lawbot bridge 미설정") {
      await prisma.caseAnalysisRun
        .create({
          data: {
            caseId: c.id,
            runType: "scheduled",
            status: "SKIPPED",
            errorMessage: result.error,
          },
        })
        .catch(() => undefined);
      skipped++;
    } else {
      await prisma.caseAnalysisRun
        .create({
          data: {
            caseId: c.id,
            runType: "scheduled",
            status: "FAILED",
            errorMessage: result.error,
          },
        })
        .catch(() => undefined);
      failed++;
    }
  }

  logger.info("[cron:lawbot-batch] done", { analyzed, skipped, failed });
  return NextResponse.json({
    ok: true,
    runAt: new Date().toISOString(),
    candidates: candidates.length,
    analyzed,
    skipped,
    failed,
  });
}
