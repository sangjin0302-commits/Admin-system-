import { NextResponse } from "next/server";

import {
  computeAllPricing,
  getAllPricing,
} from "@/lib/services/pricing-optimizer-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = await getAllPricing();
  return NextResponse.json({ ok: true, ...env });
}

export async function POST() {
  const env = await computeAllPricing();
  return NextResponse.json({ ok: true, ...env });
}
