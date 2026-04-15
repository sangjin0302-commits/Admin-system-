import { NextResponse } from "next/server";

import { sendDailyScheduleTelegramBriefing } from "@/lib/notifications/daily-schedule-telegram";

function assertCronAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    throw new Error("CRON_SECRET is not configured.");
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (token !== expected) {
    throw new Error("Unauthorized cron request.");
  }
}

export async function GET(request: Request) {
  try {
    assertCronAuthorized(request);
    const result = await sendDailyScheduleTelegramBriefing();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send daily schedule briefing."
      },
      { status: 401 }
    );
  }
}
