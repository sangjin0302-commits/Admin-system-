import { NextResponse } from "next/server";

import { readMarketingSnapshot } from "@/lib/services/marketing-sync-service";

export async function GET() {
  try {
    const snapshot = await readMarketingSnapshot();
    if (!snapshot) {
      return NextResponse.json({ error: "No marketing snapshot found" }, { status: 404 });
    }
    return NextResponse.json({ snapshot });
  } catch {
    return NextResponse.json({ error: "Failed to load marketing snapshot" }, { status: 500 });
  }
}