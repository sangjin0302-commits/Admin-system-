import { NextResponse } from "next/server";

import { getTestResults } from "@/lib/services/ab-test-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const testKey = searchParams.get("testKey");
  if (!testKey) {
    return NextResponse.json({ error: "testKey required" }, { status: 400 });
  }
  return NextResponse.json(getTestResults(testKey));
}
