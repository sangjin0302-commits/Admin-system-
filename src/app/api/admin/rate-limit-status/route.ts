import { NextResponse } from "next/server";
import { getRateLimitStats } from "@/lib/services/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = getRateLimitStats();

  return NextResponse.json({
    activeKeys: stats.length,
    entries: stats,
    timestamp: new Date().toISOString(),
  });
}
