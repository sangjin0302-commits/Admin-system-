import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const quotePendingEnabled = await isFeatureEnabled("sidebar_quote_pending_badge").catch(() => true);
    const [unresponded, receivables, dueSoon, quotePending] = await Promise.all([
      prisma.inquiry
        .count({
          where: {
            firstResponseAt: null,
            status: { notIn: ["WON", "CLOSED"] },
            createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        })
        .catch(() => 0),
      (await isFeatureEnabled("receivable_alert"))
        ? prisma.inquiry
            .count({
              where: {
                status: "WON",
                updatedAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
              },
            })
            .catch(() => 0)
        : Promise.resolve(0),
      prisma.inquiry
        .count({
          where: {
            dueDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            status: { notIn: ["WON", "CLOSED"] },
          },
        })
        .catch(() => 0),
      quotePendingEnabled
        ? prisma.inquiry
            .count({ where: { status: "QUOTE_PENDING" } })
            .catch(() => 0)
        : Promise.resolve(0),
    ]);
    return NextResponse.json({ unresponded, receivables, dueSoon, quotePending });
  } catch {
    return NextResponse.json({ unresponded: 0, receivables: 0, dueSoon: 0, quotePending: 0 });
  }
}
