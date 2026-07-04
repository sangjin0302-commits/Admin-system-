import { NextResponse } from "next/server";

import {
  consumeRateLimit,
  getClientIpFromHeaders,
} from "@/lib/security/rate-limit";
import { logger } from "@/lib/utils/logger";

const MAX_TEXT_LEN = 4000;

export async function POST(req: Request) {
  try {
    try {
      const ip = getClientIpFromHeaders(req.headers);
      const rl = consumeRateLimit({
        namespace: "ai-chat-feedback",
        key: ip,
        max: 20,
        windowMs: 60_000,
      });
      if (!rl.allowed) {
        return new NextResponse(null, { status: 429 });
      }
    } catch {
      // ignore rate-limit failures
    }

    const body = await req.json().catch(() => ({}));
    const messageId =
      typeof body?.messageId === "string" ? body.messageId.slice(0, 200) : "";
    const rating = body?.rating;
    const question =
      typeof body?.question === "string" ? body.question.slice(0, MAX_TEXT_LEN) : "";
    const answer =
      typeof body?.answer === "string" ? body.answer.slice(0, MAX_TEXT_LEN) : "";

    if (rating !== "up" && rating !== "down") {
      return new NextResponse(null, { status: 400 });
    }
    if (!messageId) {
      return new NextResponse(null, { status: 400 });
    }

    logger.info("[ai-chat-feedback]", {
      messageId,
      rating,
      question,
      answer,
      ts: new Date().toISOString(),
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
