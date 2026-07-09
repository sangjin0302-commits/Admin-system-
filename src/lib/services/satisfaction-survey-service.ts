import { prisma } from "@/lib/prisma/client";
import { sendEmail } from "@/lib/services/email-service";
import { logger } from "@/lib/utils/logger";

const SURVEY_TRACKING_KEY = "satisfaction_survey_sent";

async function getSentSurveys(): Promise<string[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: SURVEY_TRACKING_KEY },
  });
  return setting?.value ? JSON.parse(setting.value) : [];
}

async function markSurveySent(caseId: string): Promise<void> {
  const sent = await getSentSurveys();
  sent.push(caseId);
  await prisma.siteSetting.upsert({
    where: { key: SURVEY_TRACKING_KEY },
    update: { value: JSON.stringify(sent) },
    create: { key: SURVEY_TRACKING_KEY, value: JSON.stringify(sent) },
  });
}

export async function scheduleAutoSurvey(caseId: string): Promise<void> {
  logger.info(`Survey scheduled for case ${caseId} (will send after 3 days)`);
  // The actual sending is handled by the daily cron job
  // This function exists as a hook point for when case status changes to CLOSED
}

export async function processScheduledSurveys(): Promise<{ sent: number; skipped: number }> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const threeDaysAgoStart = new Date(threeDaysAgo);
  threeDaysAgoStart.setHours(0, 0, 0, 0);
  const threeDaysAgoEnd = new Date(threeDaysAgo);
  threeDaysAgoEnd.setHours(23, 59, 59, 999);

  // Find cases closed exactly 3 days ago
  const closedCases = await prisma.caseMatter.findMany({
    where: {
      status: "CLOSED",
      updatedAt: { gte: threeDaysAgoStart, lte: threeDaysAgoEnd },
    },
    select: {
      id: true,
      title: true,
      caseNo: true,
      inquiry: {
        select: {
          contactName: true,
          email: true,
        },
      },
    },
  });

  const alreadySent = await getSentSurveys();
  let sent = 0;
  let skipped = 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ethosattorney.com";

  for (const c of closedCases) {
    if (alreadySent.includes(c.id)) {
      skipped++;
      continue;
    }

    const email = c.inquiry?.email;
    if (!email) {
      logger.warn(`No email for case ${c.id}, skipping survey`);
      skipped++;
      continue;
    }

    const surveyUrl = `${siteUrl}/portal/survey/${c.id}`;
    const clientName = c.inquiry?.contactName || "고객";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #2563eb;">ETHOS 행정사사무소</h2>
  <p>${clientName}님 안녕하세요,</p>
  <p>최근 저희 사무소를 이용해 주셔서 감사합니다.</p>
  <p>더 나은 서비스를 제공하기 위해 간단한 만족도 설문에 참여해 주시면 감사하겠습니다.</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${surveyUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
      만족도 설문 참여하기
    </a>
  </p>
  <p style="font-size: 13px; color: #666;">사건번호: ${c.caseNo || c.id}</p>
  <p style="font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    본 이메일은 ETHOS 행정사사무소에서 자동 발송되었습니다.
  </p>
</body>
</html>`;

    try {
      await sendEmail({
        to: email,
        subject: "[ETHOS] 서비스 만족도 설문 안내",
        html,
      });
      await markSurveySent(c.id);
      sent++;
      logger.info(`Survey sent for case ${c.id} to ${email}`);
    } catch (err) {
      logger.error(`Failed to send survey for case ${c.id}:`, err);
      skipped++;
    }
  }

  return { sent, skipped };
}
