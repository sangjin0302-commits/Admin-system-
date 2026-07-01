import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendTelegramAlert } from "@/lib/services/telegram-notify";
import { getTopNextActions } from "@/lib/services/next-actions-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Today's priorities
    const actions = await getTopNextActions(5);

    // 2. Deadline-imminent (dueDate within 7 days)
    const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dueSoon = await prisma.inquiry.findMany({
      where: {
        dueDate: { lte: soon, gte: new Date() },
        status: { notIn: ["WON", "CLOSED"] },
      },
      select: { id: true, title: true, contactName: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // 3. Unresponded (WAITING_CONSULTATION > 2 days)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const unresponded = await prisma.inquiry.findMany({
      where: {
        status: "WAITING_CONSULTATION",
        updatedAt: { lte: twoDaysAgo },
      },
      select: { id: true, title: true, contactName: true, updatedAt: true },
      take: 5,
    });

    // 4. Yesterday's new inquiries
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newCount = await prisma.inquiry.count({
      where: { createdAt: { gte: yesterday } },
    });

    const lines: string[] = [];
    lines.push("");
    lines.push(`📥 어제 신규 문의: ${newCount}건`);

    if (dueSoon.length > 0) {
      lines.push("");
      lines.push("⏰ 임박한 기한 (7일 내):");
      for (const d of dueSoon) {
        const days = Math.ceil((d.dueDate!.getTime() - Date.now()) / 86400000);
        lines.push(`  • D-${days}: ${d.contactName ?? "미상"} - ${d.title.slice(0, 30)}`);
      }
    }

    if (unresponded.length > 0) {
      lines.push("");
      lines.push("🔴 2일+ 미응답:");
      for (const u of unresponded) {
        const days = Math.floor((Date.now() - u.updatedAt.getTime()) / 86400000);
        lines.push(`  • ${days}일째: ${u.contactName ?? "미상"} - ${u.title.slice(0, 30)}`);
      }
    }

    if (actions.length > 0) {
      lines.push("");
      lines.push("🎯 오늘의 우선 액션:");
      for (const a of actions.slice(0, 5)) {
        const urgIcon = a.urgency === "high" ? "🔥" : a.urgency === "medium" ? "⚡" : "•";
        lines.push(`  ${urgIcon} ${a.contactName ?? "미상"}: ${a.action.slice(0, 60)}`);
      }
    }

    await sendTelegramAlert({
      kind: "system",
      title: `☀️ ETHOS 오늘의 브리핑 (${new Date().toLocaleDateString("ko-KR")})`,
      lines,
    });

    return NextResponse.json({
      ok: true,
      sent: true,
      newCount,
      dueSoon: dueSoon.length,
      unresponded: unresponded.length,
      actions: actions.length,
    });
  } catch (err) {
    logger.error("[daily-briefing] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
