import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/utils/logger";
import { getUsage, incrementUsage } from "@/lib/services/ai-subscription-service";
import { buildRagContext } from "@/lib/services/ai-knowledge-base-service";
import { findFaqMatch } from "@/lib/services/ai-faq-cache-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getPortalUser, portalUserKey } from "@/lib/security/portal-auth";
import { consumeRateLimit, getClientIpFromHeaders, getEnvInt } from "@/lib/security/rate-limit";

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

    // 구독 한도 게이트.
    //
    // 예전에는 호출자가 스스로 밝힌 x-user-email/x-portal-user/body.userId 로만
    // 신원을 잡았다. 즉 그 세 개를 빼고 부르면 한도 검사가 통째로 건너뛰어져,
    // 무료 5회 제한이 헤더 하나로 무력화되고 Pro 요금제가 무의미해졌다.
    //
    // 이제 신원은 세션에서만 얻고, 비로그인 호출은 IP 기준으로 따로 제한한다.
    const sessionUser = await getPortalUser();
    const userId = sessionUser ? portalUserKey(sessionUser) : "";

    if (!userId) {
      const ip = getClientIpFromHeaders(request.headers);
      const anon = consumeRateLimit({
        namespace: "public-ai-chat-anon",
        key: ip,
        max: getEnvInt("PUBLIC_AI_CHAT_ANON_MAX", 5, 1, 100),
        windowMs: getEnvInt("PUBLIC_AI_CHAT_ANON_WINDOW_MS", 24 * 60 * 60 * 1000, 60_000, 7 * 24 * 60 * 60 * 1000)
      });
      if (!anon.allowed) {
        return NextResponse.json(
          {
            error:
              "무료 상담 횟수를 모두 사용하셨습니다. 로그인 후 이용하시거나 Pro 요금제를 확인해 주세요.",
            code: "QUOTA_EXCEEDED",
            upgradeUrl: "/ai-subscription"
          },
          { status: 402, headers: { "Retry-After": String(anon.retryAfterSec) } }
        );
      }
    }

    if (userId) {
      const usage = await getUsage(userId).catch(() => null);
      if (usage && usage.quota >= 0 && usage.remaining <= 0) {
        return NextResponse.json(
          {
            error:
              "이번 달 무료 검토 5회를 모두 사용하셨습니다. Pro 요금제로 업그레이드하시면 무제한 상담이 가능합니다.",
            code: "QUOTA_EXCEEDED",
            upgradeUrl: "/ai-subscription",
          },
          { status: 402 }
        );
      }
      // Consume one credit for tracking (best-effort, non-blocking on failure)
      await incrementUsage(userId).catch(() => null);
    }

    // FAQ fast-path: 사전 작성 답변으로 API 호출 절감
    if (await isFeatureEnabled("ai_faq_fast_path")) {
      const lastMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastMsg) {
        const faqResponse = findFaqMatch(String(lastMsg.content));
        if (faqResponse) {
          return NextResponse.json({ type: "faq", content: faqResponse });
        }
      }
    }

    const trimmed = messages.slice(-MAX_MESSAGES).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content).slice(0, MAX_INPUT_LENGTH),
    }));

    // RAG 지식베이스 컨텍스트 주입
    let systemPrompt = SYSTEM_PROMPT;
    if (await isFeatureEnabled("ai_chatbot_rag")) {
      const lastUserMsg = [...trimmed].reverse().find((m) => m.role === "user");
      if (lastUserMsg) {
        const ragContext = buildRagContext(lastUserMsg.content);
        if (ragContext) {
          systemPrompt += `\n\n## 참고 지식베이스:\n${ragContext}`;
        }
      }
    }

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
        system: systemPrompt,
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
