import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * 매일 1회 (08:00 KST). 24h+ 미응답 의뢰가 있으면 Jean에게 텔레그램 alert.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stale = await prisma.inquiry.findMany({
    where: {
      status: { in: ["NEW", "PRE_DIAGNOSED", "IN_REVIEW", "WAITING_CONSULTATION"] },
      createdAt: { lt: cutoff }
    },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: { id: true, title: true, inquiryType: true, createdAt: true }
  }).catch(() => []);

  if (stale.length === 0) {
    return NextResponse.json({ ok: true, stale: 0 });
  }

  const lines = stale.map((s) => {
    const hours = Math.floor((Date.now() - s.createdAt.getTime()) / (1000 * 60 * 60));
    return `· ${s.title} (${s.inquiryType}) — ${hours}h 경과`;
  });

  await sendTelegramAlert({
    kind: "system",
    title: `미응답 의뢰 ${stale.length}건 (24h+)`,
    lines,
    url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/inquiries` : undefined
  });

  logger.info("[cron/stale-inquiries-alert]", { count: stale.length });
  return NextResponse.json({ ok: true, stale: stale.length });
}
