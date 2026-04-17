import { NextResponse } from "next/server";

import { saveMarketingSnapshot, verifyMarketingSyncToken } from "@/lib/services/marketing-sync-service";

export async function POST(request: Request) {
  const token = request.headers.get("x-admin-sync-token");
  if (!verifyMarketingSyncToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await saveMarketingSnapshot(payload);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to ingest marketing snapshot" }, { status: 500 });
  }
}