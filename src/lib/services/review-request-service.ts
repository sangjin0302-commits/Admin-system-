/**
 * 후기 요청 자동화 — 종결(CLOSED) 사건 30일 후 만족도 설문 + 리뷰 요청 발송.
 *
 * 저장:
 *   - Inquiry에 reviewRequestedAt 컬럼이 없으므로 internalMemo(JSON string) meta에 저장하거나
 *     별도 SiteSetting("review.requested.<inquiryId>")로 마킹. 여기서는 SiteSetting을 마커로 사용.
 *   - 하지만 조회 성능을 위해 CaseMatter.closedAt + Inquiry.internalMemo(reviewRequestedAt)를 병행.
 *
 * 실제 저장 전략:
 *   - internalMemo가 JSON 형태가 아닐 수 있으므로 안전하게 SiteSetting key = "review.req.<inquiryId>" 로 저장.
 */

import { prisma } from "@/lib/prisma/client";
import { sendEmail } from "@/lib/services/email-service";
import { sendKakaoAlimtalk } from "@/lib/services/kakao-notification-service";
import { logger } from "@/lib/utils/logger";

const REVIEW_MARKER_PREFIX = "review.req.";

function markerKey(inquiryId: string): string {
  return `${REVIEW_MARKER_PREFIX}${inquiryId}`;
}

async function isReviewRequested(inquiryId: string): Promise<boolean> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: markerKey(inquiryId) } });
    return !!row?.value;
  } catch {
    return false;
  }
}

async function markReviewRequested(inquiryId: string): Promise<void> {
  const value = new Date().toISOString();
  await prisma.siteSetting.upsert({
    where: { key: markerKey(inquiryId) },
    create: { key: markerKey(inquiryId), value },
    update: { value },
  });
}

/**
 * 종결 30일 경과 & 아직 후기 요청 안 보낸 사건 찾기.
 */
export async function findCasesForReviewRequest(): Promise<
  Array<{
    inquiryId: string;
    caseMatterId: string;
    contactName: string;
    email: string;
    phone: string | null;
    closedAt: Date;
    title: string;
  }>
> {
  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const cases = await prisma.caseMatter.findMany({
    where: {
      status: "CLOSED",
      closedAt: { lte: threshold, not: null },
      inquiryId: { not: null },
    },
    select: {
      id: true,
      title: true,
      closedAt: true,
      inquiryId: true,
      inquiry: {
        select: {
          id: true,
          contactName: true,
          email: true,
          phone: true,
        },
      },
    },
    take: 200,
  });

  const results: Array<{
    inquiryId: string;
    caseMatterId: string;
    contactName: string;
    email: string;
    phone: string | null;
    closedAt: Date;
    title: string;
  }> = [];

  for (const c of cases) {
    if (!c.inquiry || !c.closedAt) continue;
    const already = await isReviewRequested(c.inquiry.id);
    if (already) continue;
    results.push({
      inquiryId: c.inquiry.id,
      caseMatterId: c.id,
      contactName: c.inquiry.contactName,
      email: c.inquiry.email,
      phone: c.inquiry.phone,
      closedAt: c.closedAt,
      title: c.title,
    });
  }

  return results;
}

async function ensureSurvey(inquiryId: string, clientName: string, clientEmail: string): Promise<string> {
  // 기존 설문이 있으면 그대로 사용
  const existing = await prisma.satisfactionSurvey.findFirst({
    where: { inquiryId },
    select: { token: true },
  });
  if (existing) return existing.token;

  const { randomBytes } = await import("crypto");
  const token = randomBytes(24).toString("hex");
  await prisma.satisfactionSurvey.create({
    data: {
      inquiryId,
      clientName,
      clientEmail,
      token,
      score: 0,
      status: "PENDING",
    },
  });
  return token;
}

function surveyUrlFor(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ethosattorney.com";
  return `${base}/survey/${token}`;
}

/**
 * 단일 사건 후기 요청 발송. 이메일 + (가능 시) 카카오 알림톡.
 */
export async function sendReviewRequest(inquiryId: string): Promise<{
  ok: boolean;
  channels: string[];
  surveyToken?: string;
  error?: string;
}> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, contactName: true, email: true, phone: true, title: true },
  });
  if (!inquiry) return { ok: false, channels: [], error: "문의를 찾을 수 없습니다." };
  if (!inquiry.email) return { ok: false, channels: [], error: "이메일이 없습니다." };

  const token = await ensureSurvey(inquiry.id, inquiry.contactName, inquiry.email);
  const surveyUrl = surveyUrlFor(token);

  const channels: string[] = [];

  // 이메일
  try {
    const emailResult = await sendEmail({
      to: inquiry.email,
      subject: "[ETHOS] 서비스 이용 후기를 부탁드립니다",
      html: `<div style="font-family:sans-serif;max-width:560px;">
  <p>${inquiry.contactName || "고객"}님, 안녕하세요.</p>
  <p>얼마 전 종결된 <strong>${inquiry.title}</strong> 건 관련하여, 서비스 이용 후기를 부탁드리고자 연락드립니다.</p>
  <p>1분이면 충분한 간단한 만족도 조사입니다. 응답 후에는 네이버 · 카카오 리뷰 링크도 안내드립니다.</p>
  <p style="margin:24px 0;">
    <a href="${surveyUrl}" style="display:inline-block;padding:12px 24px;background:#1a3c5f;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">만족도 조사 참여하기</a>
  </p>
  <p style="color:#666;font-size:13px;">— ETHOS 행정사사무소</p>
</div>`,
    });
    if (emailResult.ok) channels.push("email");
  } catch (err) {
    logger.warn("[review-request] email 실패", { inquiryId, err });
  }

  // 카카오 알림톡 (템플릿이 있는 조직만 성공, 그 외는 조용히 skip)
  if (inquiry.phone) {
    try {
      const templateId = process.env.SOLAPI_REVIEW_TEMPLATE_ID;
      if (templateId) {
        const ok = await sendKakaoAlimtalk(
          {
            to: inquiry.phone,
            templateId,
            variables: {
              "#{고객명}": inquiry.contactName || "고객",
              "#{설문링크}": surveyUrl,
            },
          },
          `[ETHOS] ${inquiry.contactName || "고객"}님, 서비스 이용 후기를 부탁드립니다. ${surveyUrl}`
        );
        if (ok) channels.push("kakao");
      }
    } catch (err) {
      logger.warn("[review-request] kakao 실패", { inquiryId, err });
    }
  }

  await markReviewRequested(inquiryId);

  return { ok: channels.length > 0, channels, surveyToken: token };
}

/**
 * 배치 실행 (cron에서 호출).
 */
export async function runReviewRequestBatch(): Promise<{
  found: number;
  sent: number;
  failed: number;
}> {
  const cases = await findCasesForReviewRequest();
  let sent = 0;
  let failed = 0;
  for (const c of cases) {
    try {
      const res = await sendReviewRequest(c.inquiryId);
      if (res.ok) sent++;
      else failed++;
    } catch (err) {
      failed++;
      logger.error("[review-request] 발송 실패", { inquiryId: c.inquiryId, err });
    }
  }
  return { found: cases.length, sent, failed };
}
