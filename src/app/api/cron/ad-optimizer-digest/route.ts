import { NextResponse } from "next/server";

import { generateReport } from "@/lib/services/ad-optimizer-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * 매주 월요일 10am KST — 광고 성과 요약 및 상위 권장 사항을 텔레그램으로 전송.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await generateReport(30);

    const summaryLines = [
      `📊 30일 총 의뢰 ${report.totals.inquiries}건 · 지출 ₩${report.totals.spend.toLocaleString("ko-KR")}`,
      `평균 CPA ₩${report.totals.avgCpa.toLocaleString("ko-KR")} · 평균 전환율 ${(report.totals.avgConversion * 100).toFixed(1)}%`,
      "",
    ];

    const recLines = report.recommendations.slice(0, 5).map((r, i) => {
      const icon =
        r.action === "increase"
          ? "⬆️"
          : r.action === "decrease"
            ? "⬇️"
            : r.action === "test"
              ? "🧪"
              : "➖";
      return `${i + 1}. ${icon} ${r.message}`;
    });

    const lines = [
      ...summaryLines,
      recLines.length > 0 ? "🎯 상위 권장" : "🎯 권장 사항 없음",
      ...recLines,
    ];

    await sendTelegramAlert({
      kind: "system",
      title: "주간 광고 최적화 리포트",
      lines,
      url: "/admin/marketing/ad-optimizer",
    }).catch((err) => logger.warn("[ad-optimizer-digest] telegram failed", err));

    return NextResponse.json({ ok: true, recommendations: report.recommendations.length });
  } catch (err) {
    logger.error("[ad-optimizer-digest] failed", err);
    return NextResponse.json({ ok: false, error: "digest failed" }, { status: 500 });
  }
}
