import { NextResponse } from "next/server";

import { forecastRevenue } from "@/lib/services/revenue-prediction-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthsParam = searchParams.get("months");
  const months = Math.max(
    1,
    Math.min(24, Number.parseInt(monthsParam ?? "6", 10) || 6),
  );

  const result = await forecastRevenue(months);
  return NextResponse.json(result);
}
