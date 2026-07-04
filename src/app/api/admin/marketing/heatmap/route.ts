import { NextResponse } from "next/server";

import { getInquiryHeatmap } from "@/lib/services/inquiry-heatmap-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const daysRaw = url.searchParams.get("days");
  const days = daysRaw ? parseInt(daysRaw, 10) : 30;
  const data = await getInquiryHeatmap(Number.isFinite(days) ? days : 30);
  return NextResponse.json(data);
}
