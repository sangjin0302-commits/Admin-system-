import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import {
  getContentBrief,
  getDailyBrief,
  getMonthlyStrategy,
  getWeeklyStrategy,
} from "@/lib/services/market-analyze-client";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const url = new URL(req.url);
  const edition = url.searchParams.get("edition") ?? undefined;
  const date = url.searchParams.get("date") ?? undefined;

  try {
    let result: unknown;
    switch (type) {
      case "daily-brief":
        result = await getDailyBrief(edition, date);
        break;
      case "content-brief":
        result = await getContentBrief(edition, date);
        break;
      case "weekly-strategy":
        result = await getWeeklyStrategy();
        break;
      case "monthly-strategy":
        result = await getMonthlyStrategy();
        break;
      default:
        return NextResponse.json({ error: `Unknown report type: ${type}` }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    logger.error(`[market-bot:reports:${type}] failed`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "조회 실패" },
      { status: 500 }
    );
  }
}
