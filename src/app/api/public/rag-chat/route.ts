import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/services/rate-limiter";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { askWithRag, submitFeedback } from "@/lib/services/rag-chatbot-service";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const enabled = await isFeatureEnabled("rag_chatbot");
  if (!enabled) {
    return NextResponse.json({ ok: false, error: "rag_chatbot 비활성화" }, { status: 403 });
  }
  const ip = getIp(request);
  const rl = rateLimit(`rag:chat:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "요청이 너무 잦습니다." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "잘못된 본문" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  // Feedback subroute
  if (b.action === "feedback" && typeof b.logId === "string" && (b.feedback === "up" || b.feedback === "down")) {
    const ok = await submitFeedback(b.logId, b.feedback);
    return NextResponse.json({ ok });
  }

  const question = typeof b.question === "string" ? b.question.trim() : "";
  if (question.length < 3) {
    return NextResponse.json({ ok: false, error: "질문은 3자 이상" }, { status: 400 });
  }

  const stream = typeof b.stream === "boolean" ? b.stream : true;

  try {
    const result = await askWithRag(question);
    if (!stream) {
      return NextResponse.json({ ok: true, ...result });
    }
    // SSE — 답변을 청크 단위로 스트리밍 (Anthropic 스트리밍 없이 문자열 청킹으로 사용자 체감 개선)
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(
            encoder.encode(`event: sources\ndata: ${JSON.stringify(result.sources)}\n\n`)
          );
          const CHUNK = 30;
          for (let i = 0; i < result.answer.length; i += CHUNK) {
            const chunk = result.answer.slice(i, i + CHUNK);
            controller.enqueue(
              encoder.encode(`event: token\ndata: ${JSON.stringify({ text: chunk })}\n\n`)
            );
            await new Promise((r) => setTimeout(r, 15));
          }
          controller.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({
                logId: result.logId,
                confidence: result.confidence,
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    logger.error("[rag-chat] failed", err);
    return NextResponse.json({ ok: false, error: "답변 생성 실패" }, { status: 500 });
  }
}
