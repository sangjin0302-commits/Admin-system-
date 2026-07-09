import { NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 매일 23:30 KST. KPI 스냅샷 이메일 발송.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("daily_dashboard_email"))) {
    return NextResponse.json({ ok: true, skipped: "flag-off" });
  }

  const to = process.env.ADMIN_ALERT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  if (!to || !apiKey) {
    return NextResponse.json({ ok: false, error: "ADMIN_ALERT_EMAIL or RESEND_API_KEY not set" });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateStr = now.toISOString().slice(0, 10);

  const [totalInquiries, newToday, wonThisMonth, pendingCount] = await Promise.all([
    prisma.inquiry.count().catch(() => 0),
    prisma.inquiry.count({ where: { createdAt: { gte: todayStart } } }).catch(() => 0),
    prisma.inquiry.count({ where: { status: "WON", updatedAt: { gte: monthStart } } }).catch(() => 0),
    prisma.inquiry.count({
      where: { status: { in: ["NEW", "PRE_DIAGNOSED", "IN_REVIEW", "WAITING_CONSULTATION"] } },
    }).catch(() => 0),
  ]);

  // Avg response time: difference between createdAt and firstResponseAt for inquiries responded today
  const responded = await prisma.inquiry.findMany({
    where: { firstResponseAt: { gte: todayStart } },
    select: { createdAt: true, firstResponseAt: true },
  }).catch(() => []);

  let avgResponseHours = "-";
  if (responded.length > 0) {
    const totalMs = responded.reduce((sum, r) => {
      return sum + ((r.firstResponseAt?.getTime() ?? r.createdAt.getTime()) - r.createdAt.getTime());
    }, 0);
    avgResponseHours = (totalMs / responded.length / (1000 * 60 * 60)).toFixed(1) + "h";
  }

  const html = `
    <div style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a3c5f; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #faf6ef; font-size: 20px; margin: 0;">
          <span style="color: #c9a961;">ETHOS</span> 일일 KPI 리포트
        </h1>
        <p style="color: #9ca3af; font-size: 13px; margin: 4px 0 0;">${dateStr}</p>
      </div>
      <div style="background: #faf6ef; padding: 32px; border: 1px solid #e8e0d4; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #e8e0d4;">
            <td style="padding: 12px 0; color: #6b7280;">전체 문의</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1a3c5f;">${totalInquiries}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e8e0d4;">
            <td style="padding: 12px 0; color: #6b7280;">오늘 신규</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1a3c5f;">${newToday}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e8e0d4;">
            <td style="padding: 12px 0; color: #6b7280;">이번 달 WON</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #22c55e;">${wonThisMonth}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e8e0d4;">
            <td style="padding: 12px 0; color: #6b7280;">미처리 (대기)</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #ef4444;">${pendingCount}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #6b7280;">평균 응답 시간</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1a3c5f;">${avgResponseHours}</td>
          </tr>
        </table>
      </div>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL ?? "noreply@ethos.kr";
    const { error } = await resend.emails.send({
      from: `ETHOS KPI <${fromEmail}>`,
      to,
      subject: `[ETHOS] 일일 KPI 리포트 - ${dateStr}`,
      html,
    });
    if (error) {
      logger.error("[cron/daily-kpi-email] send error", error);
      return NextResponse.json({ ok: false, error: error.message });
    }
  } catch (err) {
    logger.error("[cron/daily-kpi-email] error", err);
    return NextResponse.json({ ok: false, error: "send-failed" });
  }

  logger.info("[cron/daily-kpi-email] sent", { to, dateStr });
  return NextResponse.json({ ok: true, sent: dateStr });
}
