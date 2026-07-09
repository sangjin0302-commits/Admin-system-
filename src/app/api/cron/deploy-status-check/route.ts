/**
 * Vercel Cron — 매일 07:00 UTC 배포 상태 확인, 실패 시 텔레그램 알림.
 */

import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("deploy_status_monitor"))) {
    return NextResponse.json({ ok: true, skipped: true, reason: "feature_disabled" });
  }

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID ?? "prj_TdKYyeXInz4lwUEi1gcycCYYBWi1";
  const teamId = process.env.VERCEL_TEAM_ID ?? "team_KQyZosmlEvdSwYQMFJiTWLyd";

  if (!token) {
    return NextResponse.json({ ok: false, error: "VERCEL_TOKEN not configured" }, { status: 500 });
  }

  try {
    const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=3&teamId=${teamId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      logger.error("[cron:deploy-status-check] Vercel API error", res.status);
      return NextResponse.json({ ok: false, error: `vercel_api_${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    const deployments = data.deployments ?? [];

    if (deployments.length === 0) {
      return NextResponse.json({ ok: true, runAt: new Date().toISOString(), deployments: 0 });
    }

    const latest = deployments[0];

    if (latest.state !== "READY") {
      const deployUrl = `https://vercel.com/${teamId}/${latest.name}/${latest.uid}`;
      await sendTelegramAlert({
        kind: "system",
        title: "Vercel 배포 실패",
        lines: [
          `상태: ${latest.state}`,
          `배포 ID: ${latest.uid}`,
          `시간: ${new Date(latest.createdAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`,
        ],
        url: deployUrl,
      });

      return NextResponse.json({
        ok: true,
        runAt: new Date().toISOString(),
        alert: true,
        state: latest.state,
      });
    }

    return NextResponse.json({
      ok: true,
      runAt: new Date().toISOString(),
      alert: false,
      state: latest.state,
    });
  } catch (error) {
    logger.error("[cron:deploy-status-check] failed", error);
    return NextResponse.json({ ok: false, error: "deploy status check failed" }, { status: 500 });
  }
}
