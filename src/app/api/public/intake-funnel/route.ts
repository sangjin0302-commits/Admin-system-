import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { recordFunnelStep } from "@/lib/services/intake-funnel-service";

export async function POST(req: Request) {
  try {
    const enabled = await isFeatureEnabled("intake_funnel_tracking").catch(() => true);
    if (!enabled) {
      return NextResponse.json({ ok: true });
    }

    const { sessionId, step, totalSteps } = await req.json();
    if (!sessionId || typeof step !== "number" || typeof totalSteps !== "number") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await recordFunnelStep(sessionId, step, totalSteps);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
