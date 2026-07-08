import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * MM1 재의뢰 6개월 자동 알림.
 * WON 후 180일 경과 + 최근 90일 신규 문의 없는 고객 → 알림 리스트업.
 * Feature flag: `reengagement_6mo_auto`.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isFeatureEnabled("reengagement_6mo_auto"))) {
    return NextResponse.json({ ok: true, skipped: "feature_disabled" });
  }

  try {
    const cutoff180 = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const wonPast = await prisma.inquiry
      .findMany({
        where: { status: "WON", updatedAt: { lte: cutoff180 } },
        select: { id: true, title: true, contactName: true, email: true, phone: true, updatedAt: true },
        take: 100,
        orderBy: { updatedAt: "asc" },
      })
      .catch(() => []);

    const candidates: (typeof wonPast)[number][] = [];
    for (const w of wonPast) {
      if (!w.email && !w.phone) continue;
      const recent = await prisma.inquiry
        .count({
          where: {
            createdAt: { gte: cutoff90 },
            OR: [w.email ? { email: w.email } : null, w.phone ? { phone: w.phone } : null].filter(Boolean) as any,
          },
        })
        .catch(() => 0);
      if (recent === 0) candidates.push(w);
    }

    if (candidates.length > 0) {
      const lines = ["재의뢰 알림 대상 (WON 180d+ · 최근 90d 신규 없음):", ""];
      for (const c of candidates.slice(0, 10)) {
        const days = Math.floor((Date.now() - c.updatedAt.getTime()) / 86400000);
        lines.push(`• ${days}d: ${c.contactName ?? "미상"} — ${c.title.slice(0, 30)}`);
      }
      if (candidates.length > 10) lines.push(`... 외 ${candidates.length - 10}건`);
      await sendTelegramAlert({
        kind: "system",
        title: `🔁 재의뢰 candidate ${candidates.length}명`,
        lines,
      });
    }

    return NextResponse.json({ ok: true, checked: wonPast.length, candidates: candidates.length });
  } catch (err) {
    logger.error("[reengagement-6mo] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
