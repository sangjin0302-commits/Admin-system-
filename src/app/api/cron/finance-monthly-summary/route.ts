import { NextResponse } from "next/server";
import { getMonthlyReport } from "@/lib/services/financial-report-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { sendEmail } from "@/lib/services/email-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 매월 1일 실행 — 전월 재무 요약을 관리자 텔레그램 + 이메일로 발송.
 * Vercel Cron: schedule "0 1 1 * *"
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // 전월
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const y = prev.getUTCFullYear();
  const m = prev.getUTCMonth() + 1;

  try {
    const r = await getMonthlyReport(y, m);
    const fmt = (n: number) => `${n.toLocaleString()}원`;
    const title = `${y}년 ${m}월 재무 요약`;
    const lines = [
      `매출: ${fmt(r.revenue)} (${r.paymentCount}건)`,
      `미수금: ${fmt(r.unpaid)} (${r.unpaidCount}건)`,
      `환불: ${fmt(r.refunds)} (${r.refundCount}건)`,
      `예상 세금: ${fmt(r.taxEstimate.total)}`,
      `순이익: ${fmt(r.netIncome)}`,
      `문의 유입: ${r.inquiryCount}건`,
    ];

    const tg = await sendTelegramAlert({ kind: "system", title, lines });

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL?.trim();
    let emailResult: { ok: boolean; error?: string } = { ok: false, error: "no_admin_email" };
    if (adminEmail) {
      const html = `
        <h2>${title}</h2>
        <ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>
        <p style="color:#888;font-size:12px">${r.taxEstimate.note}</p>
        <h3>카테고리별</h3>
        <ul>${r.byCategory.map((c) => `<li>${c.category}: ${fmt(c.revenue)} (${c.count}건)</li>`).join("") || "<li>없음</li>"}</ul>
      `;
      emailResult = await sendEmail({ to: adminEmail, subject: title, html });
    }

    logger.info("[cron:finance-monthly-summary]", { y, m, telegram: tg.ok, email: emailResult.ok });
    return NextResponse.json({
      ok: true,
      period: { year: y, month: m },
      revenue: r.revenue,
      netIncome: r.netIncome,
      telegram: tg,
      email: emailResult,
    });
  } catch (error) {
    logger.error("[cron:finance-monthly-summary] failed", error);
    return NextResponse.json({ ok: false, error: "summary failed" }, { status: 500 });
  }
}
