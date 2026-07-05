import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { startVoiceSession } from "@/lib/services/voice-ai-consult-service";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function visitorIdFromRequest(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") ?? "";
  const first = xf.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "anonymous";
}

export async function POST(req: Request) {
  try {
    if (!(await isFeatureEnabled("voice_ai_consult"))) {
      return NextResponse.json({ error: "기능이 비활성화되었습니다" }, { status: 404 });
    }
    const body = await req.json().catch(() => ({}));
    const topic = typeof body?.topic === "string" ? body.topic.slice(0, 200) : undefined;
    const handle = startVoiceSession({
      visitorId: visitorIdFromRequest(req),
      topic,
    });
    if (!handle) {
      return NextResponse.json(
        { error: "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }
    return NextResponse.json({
      sessionId: handle.sessionId,
      provider: handle.provider,
      streamUrl: handle.streamUrl,
      token: handle.token,
      expiresAt: handle.expiresAt,
      textFallbackReason: handle.textFallbackReason ?? null,
    });
  } catch (err) {
    logger.error("[api.voice-consult.session] 실패", err instanceof Error ? { message: err.message } : { err });
    return NextResponse.json({ error: "세션 생성 실패" }, { status: 500 });
  }
}
