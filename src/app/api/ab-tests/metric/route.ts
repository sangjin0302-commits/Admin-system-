import { NextResponse } from "next/server";

import { recordMetric } from "@/lib/services/ab-test-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testKey, variant, event, sessionId } = body ?? {};
    if (
      typeof testKey !== "string" ||
      typeof variant !== "string" ||
      typeof sessionId !== "string" ||
      (event !== "view" && event !== "conversion")
    ) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }
    recordMetric({ testKey, variant, event, sessionId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "failed", detail: String(error) }, { status: 500 });
  }
}
