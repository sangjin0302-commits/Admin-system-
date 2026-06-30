import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendEmail } from "@/lib/services/email-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ethosattorney.com";

  // Find abandonments: 24h+ old, not converted, reminded < 2
  const targets = await prisma.intakeAbandonment.findMany({
    where: {
      convertedAt: null,
      reminded: { lt: 2 },
      updatedAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    take: 20,
  });

  let sent = 0;

  for (const target of targets) {
    const isFirstReminder = target.reminded === 0;
    const subject = isFirstReminder
      ? "[ETHOS] 검토 요청이 아직 완료되지 않았습니다"
      : "[ETHOS] 마지막 안내 — 무료 검토 기회를 놓치지 마세요";

    const html = isFirstReminder
      ? `<p>${target.name || "고객"}님, 작성 중이던 상담 신청서가 있습니다.</p>
<p>이어서 작성하시면 영업일 24시간 내 무료 검토 결과를 받으실 수 있습니다.</p>
<p><a href="${siteUrl}/intake?from=retarget&cat=${target.category || ""}" style="display:inline-block;padding:12px 24px;background:#1a3c5f;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">이어서 작성하기</a></p>`
      : `<p>${target.name || "고객"}님, 검토는 무료이며 의무 사항이 아닙니다.</p>
<p>간단한 상황만 알려주시면 가능 여부와 예상 비용을 안내드립니다.</p>
<p><a href="${siteUrl}/intake?from=retarget&cat=${target.category || ""}" style="display:inline-block;padding:12px 24px;background:#c9a961;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">무료 검토 받기</a></p>`;

    try {
      await sendEmail({ to: target.email, subject, html });
      await prisma.intakeAbandonment.update({
        where: { id: target.id },
        data: { reminded: target.reminded + 1, lastRemindedAt: new Date() },
      });
      sent++;
    } catch (err) {
      logger.warn("[retarget] email failed", { id: target.id, err });
    }
  }

  return NextResponse.json({ sent, total: targets.length });
}
