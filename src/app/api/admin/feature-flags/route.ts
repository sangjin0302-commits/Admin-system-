import { NextRequest, NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key parameter is required" }, { status: 400 });
  }

  const enabled = await isFeatureEnabled(key);
  return NextResponse.json({ enabled });
}
