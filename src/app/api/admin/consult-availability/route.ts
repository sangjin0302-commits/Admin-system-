import { NextResponse } from "next/server";

import {
  getAvailabilityConfig,
  saveAvailabilityConfig,
} from "@/lib/services/consultation-slots-service";

export async function GET() {
  const config = await getAvailabilityConfig();
  return NextResponse.json({ ok: true, config });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }
  const config = await saveAvailabilityConfig(body);
  return NextResponse.json({ ok: true, config });
}
