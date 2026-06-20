import { NextResponse } from "next/server";

import { cacheGet, cacheSet } from "@/lib/services/cache-service";
import { rateLimit } from "@/lib/services/rate-limiter";
import { resolveBotTier, BOT_FEATURES, type BotTier } from "@/lib/services/bot-access-tier";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;
const PII_PATTERNS = [/\d{6}-\d{7}/, /[A-Z]\d{8}/];

type BotKind = "lawbot" | "market";

type SuccessResponse = {
  answer: string;
  tier: BotTier;
  remainingQuota: number;
  restricted?: boolean;
  upgradeCta?: { text: string; href: string };
};

function buildMockAnswer(bot: BotKind, query: string): string {
  const botLabel = bot === "lawbot" ? "법령 챗봇" : "시장 분석 봇";
  const trimmed = query.length > 120 ? `${query.slice(0, 120)}…` : query;
  return [
    `[${botLabel}] 질문 "${trimmed}"에 대한 분석을 시작합니다.`,
    bot === "lawbot"
      ? "관련 법령·행정규칙을 검토한 결과, 일반적인 절차와 유의 사항은 다음과 같습니다. 구체적 사실관계에 따라 결과가 달라질 수 있으므로 담당 행정사와 상담을 권합니다."
      : "관련 산업 동향과 경쟁사 데이터를 검토한 결과, 시장 진입 전략과 경쟁 우위 요소는 다음과 같습니다. 구체적인 의사결정은 사업 환경에 따라 조정이 필요합니다.",
    "본 정보는 참고용이며 법률 자문이 아닙니다.",
  ].join("\n\n");
}

function ctaFor(tier: BotTier): SuccessResponse["upgradeCta"] | undefined {
  if (tier === "anonymous") {
    return { text: "💡 전체 답변 + 30회/일 무료 → 포털 가입", href: "/portal/signup" };
  }
  if (tier === "registered") {
    return { text: "💎 무제한 + 본인 사건 연동 → 상담 신청", href: "/intake" };
  }
  return undefined;
}

function ctaSuffix(tier: BotTier): string {
  if (tier === "anonymous") {
    return "\n\n💡 전체 답변 + 30회/일 무료 → [포털 가입](/portal/signup)";
  }
  if (tier === "registered") {
    return "\n\n💎 무제한 + 본인 사건 연동 → [상담 신청](/intake)";
  }
  return "";
}

function truncate(text: string, max: number): string {
  if (!Number.isFinite(max)) return text;
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

export async function POST(request: Request) {
  let body: { bot?: BotKind; query?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const bot = body.bot;
  const query = (body.query ?? "").trim();

  if (bot !== "lawbot" && bot !== "market") {
    return NextResponse.json({ error: "지원하지 않는 봇입니다." }, { status: 400 });
  }
  if (!query) {
    return NextResponse.json({ error: "질문을 입력하세요." }, { status: 400 });
  }
  if (query.length > 2000) {
    return NextResponse.json({ error: "질문은 2000자 이하로 입력하세요." }, { status: 400 });
  }
  for (const re of PII_PATTERNS) {
    if (re.test(query)) {
      return NextResponse.json({ error: "개인정보는 입력하지 마세요." }, { status: 400 });
    }
  }

  const resolved = await resolveBotTier(request);
  const { tier, identifier, features, dailyQuota } = resolved;

  // Bot allowed for tier?
  if (!features.allowedBots.includes(bot)) {
    return NextResponse.json<SuccessResponse>({
      answer:
        bot === "market"
          ? "시장 분석 봇은 회원 가입 후 이용하실 수 있습니다."
          : "해당 봇은 현재 등급에서 사용할 수 없습니다.",
      tier,
      remainingQuota: 0,
      restricted: true,
      upgradeCta: ctaFor(tier) ?? {
        text: "회원 가입하고 이용하기",
        href: "/portal/signup",
      },
    });
  }

  // Anonymous cache lookup (1h) for identical queries
  const cacheKey = `bot:${bot}:anon:${query}`;
  if (tier === "anonymous") {
    const cached = cacheGet<SuccessResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
  }

  // Rate limit
  let remaining: number;
  if (Number.isFinite(dailyQuota)) {
    const res = rateLimit(`bot:${tier}:${identifier}`, dailyQuota, DAY_MS);
    if (!res.allowed) {
      return NextResponse.json<SuccessResponse>({
        answer:
          tier === "anonymous"
            ? `일일 무료 사용량(${dailyQuota}회)을 모두 사용하셨습니다. 포털 가입 시 30회/일 무료 이용이 가능합니다.`
            : `일일 사용량(${dailyQuota}회)을 모두 사용하셨습니다. 상담 신청 시 무제한 이용이 가능합니다.`,
        tier,
        remainingQuota: 0,
        restricted: true,
        upgradeCta: ctaFor(tier),
      });
    }
    remaining = res.remaining;
  } else {
    remaining = Number.POSITIVE_INFINITY;
  }

  // Mock bot answer
  const rawAnswer = buildMockAnswer(bot, query);
  const truncated = truncate(rawAnswer, features.maxAnswerLength);
  const finalAnswer = truncated + ctaSuffix(tier);

  const payload: SuccessResponse = {
    answer: finalAnswer,
    tier,
    remainingQuota: Number.isFinite(remaining) ? remaining : Number.POSITIVE_INFINITY,
    upgradeCta: ctaFor(tier),
  };

  if (tier === "anonymous") {
    cacheSet(cacheKey, payload, 3600);
  }

  // Reference unused constant to keep BOT_FEATURES exported import-side meaningful
  void BOT_FEATURES;

  return NextResponse.json(payload);
}
