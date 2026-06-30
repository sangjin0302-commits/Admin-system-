import { prisma } from "@/lib/prisma/client";
import { sendEmail } from "@/lib/services/email-service";
import { logger } from "@/lib/utils/logger";
import { randomBytes } from "crypto";

export async function createSurvey(input: {
  caseId?: string;
  inquiryId?: string;
  clientName?: string;
  clientEmail: string;
}) {
  const token = randomBytes(24).toString("hex");

  const survey = await prisma.satisfactionSurvey.create({
    data: {
      ...input,
      token,
      score: 0,
      status: "PENDING",
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ethosattorney.com";
  const surveyUrl = `${siteUrl}/survey/${token}`;

  await sendEmail({
    to: input.clientEmail,
    subject: "[ETHOS] 서비스 만족도 조사 — 1분이면 충분합니다",
    html: `<p>${input.clientName || "고객"}님 안녕하세요.</p>
<p>ETHOS 행정사사무소를 이용해 주셔서 감사합니다.</p>
<p>더 나은 서비스를 위해 간단한 만족도 조사에 참여해 주시면 감사하겠습니다.</p>
<p><a href="${surveyUrl}" style="display:inline-block;padding:12px 24px;background:#1a3c5f;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">만족도 조사 참여하기</a></p>
<p>— ETHOS 행정사사무소</p>`,
  }).catch(err => logger.warn("[nps] email failed", err));

  return survey;
}

export async function submitSurvey(token: string, data: { score: number; feedback?: string; category?: string }) {
  return prisma.satisfactionSurvey.update({
    where: { token },
    data: {
      score: data.score,
      feedback: data.feedback,
      category: data.category,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

export async function getNpsStats(days = 90) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const surveys = await prisma.satisfactionSurvey.findMany({
    where: { status: "COMPLETED", completedAt: { gte: since } },
    select: { score: true },
  });

  if (surveys.length === 0) return { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };

  const promoters = surveys.filter((s: { score: number }) => s.score >= 9).length;
  const detractors = surveys.filter((s: { score: number }) => s.score <= 6).length;
  const passives = surveys.length - promoters - detractors;
  const nps = Math.round(((promoters - detractors) / surveys.length) * 100);

  return { nps, promoters, passives, detractors, total: surveys.length };
}
