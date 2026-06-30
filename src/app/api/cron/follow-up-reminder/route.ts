import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { sendEmail } from "@/lib/services/email-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 매일 1회. status="waiting_client"로 3일 이상 경과한 의뢰에 리마인더 발송.
 * - 이메일 존재 시 고객에게 안내 메일
 * - 텔레그램 관리자 알림
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const staleInquiries = await prisma.inquiry.findMany({
    where: {
      status: "WAITING_CONSULTATION",
      updatedAt: { lte: threeDaysAgo },
    },
    select: {
      id: true,
      contactName: true,
      email: true,
      phone: true,
      publicTrackingCode: true,
      updatedAt: true,
    },
    take: 20,
  });

  let reminded = 0;

  for (const inq of staleInquiries) {
    const daysSince = Math.floor(
      (Date.now() - inq.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Email reminder if email exists
    if (inq.email) {
      try {
        await sendEmail({
          to: inq.email,
          subject: `[ETHOS] ${inq.contactName || "고객"}님, 추가 자료 확인 부탁드립니다`,
          html: `<p>${inq.contactName || "고객"}님 안녕하세요, 행정사 Jean입니다.</p>
<p>요청하신 자료가 아직 접수되지 않아 안내드립니다. (${daysSince}일 경과)</p>
<p>추가 자료를 준비하시는 데 어려움이 있으시면 편하게 연락주세요.</p>
<p>— ETHOS 행정사사무소</p>`,
        });
      } catch (err) {
        logger.warn("[follow-up] email failed", { inquiryId: inq.id, err });
      }
    }

    // Telegram admin alert
    await sendTelegramAlert({
      kind: "system",
      title: `⏰ 후속 리마인더: ${inq.contactName || "미상"} (${inq.publicTrackingCode || inq.id.slice(0, 8)}) — ${daysSince}일째 대기 중`,
    }).catch(() => {});

    reminded++;
  }

  return NextResponse.json({ reminded, total: staleInquiries.length });
}
