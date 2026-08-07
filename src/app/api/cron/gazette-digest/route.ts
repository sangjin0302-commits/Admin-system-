import { NextResponse } from "next/server";

import { fetchGazetteList } from "@/lib/services/gazette-client";
import { selectRecentGazette, buildGazetteDigestLines, buildGazetteStats } from "@/lib/services/gazette-digest-format";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { sendEmail } from "@/lib/services/email-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 주간 관보 요약 — 매주 일요일 weekly-batch 그룹에서 호출(cron-dispatcher).
 * 지난 7일 관보를 텔레그램(+선택 이메일)으로 내부 발송. 기본 OFF(플래그 opt-in).
 * Vercel Cron·dispatcher 모두 GET 으로 부르므로 GET export.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 기본 비활성 — 관리자가 /admin/features 에서 켠 경우에만 발송(무단 알림 방지).
  if (!(await isFeatureEnabled("gazette_weekly_digest").catch(() => false))) {
    return NextResponse.json({ ok: true, skipped: "flag_off" });
  }

  const outcome = await fetchGazetteList(100);
  if (outcome.status !== "ok") {
    logger.info("[cron/gazette-digest] no data", { status: outcome.status });
    return NextResponse.json({ ok: true, skipped: outcome.status });
  }

  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const picked = selectRecentGazette(outcome.items, weekAgoMs);

  if (picked.length === 0) {
    logger.info("[cron/gazette-digest] nothing new this week");
    return NextResponse.json({ ok: true, count: 0 });
  }

  const top = picked.slice(0, 8);
  const lines = buildGazetteDigestLines(picked);
  const stats = buildGazetteStats(picked);
  const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("ko-KR");
  const rangeLabel = stats.dateRange
    ? `${fmtDate(stats.dateRange.fromMs)} ~ ${fmtDate(stats.dateRange.toMs)}`
    : "";
  const agencyStatsHtml = stats.byAgency
    .slice(0, 6)
    .map((a) => `<li>${escapeHtml(a.agency)} — <b>${a.count}</b>건</li>`)
    .join("");

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  await sendTelegramAlert({
    kind: "system",
    title: "주간 관보 요약",
    lines,
    url: site ? `${site}/gazette` : undefined,
  });

  let emailSent = false;
  const adminEmail = process.env.ADMIN_ALERT_EMAIL?.trim();
  if (adminEmail) {
    try {
      // 관보는 카테고리 태깅 안 함 → 발령기관을 접두로.
      const rows = top
        .map((g) => {
          const agency = (g.agency ?? "").trim()
            ? `<span style="color:#8a6d1a">[${escapeHtml(g.agency as string)}]</span> `
            : "";
          const safe = g.url && /^https?:\/\//i.test(g.url) ? g.url : null; // javascript:/data: 차단
          const title = safe
            ? `<a href="${escapeHtml(safe)}">${escapeHtml(g.title)}</a>`
            : escapeHtml(g.title);
          return `<li style="margin:4px 0">${agency}${title}</li>`;
        })
        .join("");
      await sendEmail({
        to: adminEmail,
        subject: `[ETHOS] 주간 관보 요약 — ${stats.total}건 (${new Date().toLocaleDateString("ko-KR")})`,
        html: `<h2>주간 관보 요약</h2>
<p>지난 7일 동안 수집된 관보 <b>${stats.total}</b>건${rangeLabel ? ` (${escapeHtml(rangeLabel)})` : ""} 중 상위 ${top.length}건입니다.</p>
${agencyStatsHtml ? `<h3 style="margin:14px 0 4px">기관별 통계</h3><ul style="font-size:14px;padding-left:18px">${agencyStatsHtml}</ul>` : ""}
<h3 style="margin:14px 0 4px">주요 관보</h3>
<ul style="font-size:14px;padding-left:18px">${rows}</ul>
${site ? `<p style="margin-top:16px"><a href="${site}/gazette">관보 게시판 전체 보기 →</a></p>` : ""}`,
      });
      emailSent = true;
    } catch (err) {
      logger.warn("[cron/gazette-digest] email failed", err);
    }
  }

  logger.info("[cron/gazette-digest] sent", { count: picked.length, emailSent });
  return NextResponse.json({ ok: true, count: picked.length, emailSent });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
