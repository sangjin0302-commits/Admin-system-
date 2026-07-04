import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";
import { getUsage, incrementUsage } from "@/lib/services/ai-subscription-service";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `당신은 ETHOS 행정사사무소의 AI 사전 안내 도우미입니다.
- 행정사법 제2조 기준 행정사 업무 범위 내에서만 안내합니다.
- 비자/체류(D-8, D-10, F-2-7 등), 행정심판, 인허가, 계약서/사실조사, 아랍어 번역 분야를 다룹니다.
- 법률 자문이 아닌 일반적 안내임을 명확히 합니다.
- 구체적 사안은 사무소 상담을 권합니다.
- 한국어로 답변합니다. 영어/아랍어 질문에는 해당 언어로 답변합니다.
- 간결하고 실용적으로 답변합니다 (3-5문장).
- 개인정보를 요청하거나 저장하지 않습니다.`;

const MAX_MESSAGES = 10;
const MAX_INPUT_LENGTH = 2000;

export async function POST(request: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "AI 기능이 현재 비활성화되어 있습니다." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const messages: Array<{ role: string; content: string }> = body.messages ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "메시지가 필요합니다." }, { status: 400 });
    }

    // AI subscription quota gate: only enforced when the caller identifies
    // themselves. Anonymous callers keep the legacy unlimited behavior.
    const userId =
      request.headers.get("x-user-email") ||
      request.headers.get("x-portal-user") ||
      (typeof body.userId === "string" ? body.userId : "");
    if (userId) {
      const usage = await getUsage(userId).catch(() => null);
      if (usage && usage.quota >= 0 && usage.remaining <= 0) {
        return NextResponse.json(
          {
            error:
              "이번 달 무료 상담 5회를 모두 사용하셨습니다. Pro 요금제로 업그레이드하시면 무제한 상담이 가능합니다.",
            code: "QUOTA_EXCEEDED",
            upgradeUrl: "/ai-subscription",
          },
          { status: 402 }
        );
      }
      // Consume one credit for tracking (best-effort, non-blocking on failure)
      await incrementUsage(userId).catch(() => null);
    }

    const trimmed = messages.slice(-MAX_MESSAGES).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content).slice(0, MAX_INPUT_LENGTH),
    }));

    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        stream: true,
        messages: trimmed,
      }),
    });

    if (!res.ok || !res.body) {
      logger.warn("[ai-chat] anthropic error", res.status);
      return NextResponse.json(
        { error: "AI 응답 오류가 발생했습니다." },
        { status: 502 }
      );
    }

    return new NextResponse(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    logger.warn("[ai-chat] exception", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
