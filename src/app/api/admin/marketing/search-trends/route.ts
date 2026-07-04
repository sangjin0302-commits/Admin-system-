import { NextResponse } from "next/server";

import {
  getSearchTrend,
  getTopSearchTerms,
  getUnansweredSearches,
} from "@/lib/services/search-log-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const daysRaw = url.searchParams.get("days");
  const days = Number.isFinite(Number(daysRaw)) ? Number(daysRaw) : 30;
  const [top, unanswered, trend] = await Promise.all([
    getTopSearchTerms(days, 20),
    getUnansweredSearches(days, 20),
    getSearchTrend(days),
  ]);
  return NextResponse.json({ top, unanswered, trend, days });
}
