import { NextResponse } from "next/server";

import { getBotTier } from "@/lib/services/bot-access-tier";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const bot = url.searchParams.get("bot");
  void bot;
  const info = await getBotTier(request);
  const safe = {
    ...info,
    remainingQuota: Number.isFinite(info.remainingQuota) ? info.remainingQuota : -1,
    dailyQuota: Number.isFinite(info.dailyQuota) ? info.dailyQuota : -1,
    features: {
      ...info.features,
      maxAnswerLength: Number.isFinite(info.features.maxAnswerLength) ? info.features.maxAnswerLength : -1,
    },
  };
  return NextResponse.json(safe);
}
