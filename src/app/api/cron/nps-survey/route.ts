import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createSurvey } from "@/lib/services/nps-service";
import { logger } from "@/lib/utils/logger";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find WON inquiries updated 7+ days ago
    const wonInquiries = await prisma.inquiry.findMany({
      where: {
        status: "WON",
        updatedAt: { lte: sevenDaysAgo },
      },
      select: {
        id: true,
        contactName: true,
        email: true,
      },
    });

    // Filter out those that already have a survey
    const existingSurveys = await prisma.satisfactionSurvey.findMany({
      where: {
        inquiryId: { in: wonInquiries.map((i) => i.id) },
      },
      select: { inquiryId: true },
    });

    const existingIds = new Set(existingSurveys.map((s: { inquiryId: string | null }) => s.inquiryId));
    const needsSurvey = wonInquiries.filter((i) => !existingIds.has(i.id));

    let created = 0;
    for (const inquiry of needsSurvey) {
      try {
        await createSurvey({
          inquiryId: inquiry.id,
          clientName: inquiry.contactName,
          clientEmail: inquiry.email,
        });
        created++;
      } catch (err) {
        logger.error("[nps-cron] failed to create survey", { inquiryId: inquiry.id, err });
      }
    }

    logger.info("[nps-cron] completed", {
      found: wonInquiries.length,
      alreadySurveyed: existingIds.size,
      created,
    });

    return NextResponse.json({ ok: true, found: wonInquiries.length, created });
  } catch (err) {
    logger.error("[nps-cron] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
