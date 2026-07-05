/**
 * 자동 니즈 예측 (Needs Prediction) — 진행 중 사건에서 고객의 다음 요청 예상.
 * 룰 기반 + (선택) Claude Haiku.
 */
import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export interface NeedsPrediction {
  suggestions: string[];
  reasoning: string;
  confidence: number;
  source: "rule" | "ai" | "hybrid";
  predictedAt: string;
}

// category(문자열) × status(문자열) → 다음 예상 니즈
const RULE_MAP: Array<{
  match: (category: string, status: string) => boolean;
  suggestions: string[];
  reasoning: string;
}> = [
  {
    match: (c) => /VISA|IMMIGRATION|비자|입국/i.test(c),
    suggestions: ["가족관계증명서", "재정증명서 (잔고증명)", "체류자격 관련 확약서"],
    reasoning: "비자·체류자격 관련 사건은 신원 및 재정 서류가 곧 요구됩니다.",
  },
  {
    match: (c) => /CONTRACT|계약|자문/i.test(c),
    suggestions: ["인감증명서", "법인등기부등본", "사업자등록증"],
    reasoning: "계약·자문 사건은 서명·법인 인증 서류가 뒤따릅니다.",
  },
  {
    match: (c) => /APPEAL|행정심판|이의/i.test(c),
    suggestions: ["원처분 통지서 사본", "행정심판 위임장", "증거 목록·사진 자료"],
    reasoning: "행정심판은 처분 통지 원본과 증거 정리가 필수입니다.",
  },
  {
    match: (c) => /LICENSE|허가|인허가/i.test(c),
    suggestions: ["시설 사진", "임대차계약서", "대표자 신분증"],
    reasoning: "인허가는 시설·임대·대표자 확인 서류가 반복 요구됩니다.",
  },
  {
    match: (_c, s) => /HEARING|심리|조사/i.test(s),
    suggestions: ["진술서", "위임장", "질문 예상 답변 스크립트"],
    reasoning: "심리·조사 단계 진입 시 진술 준비가 급합니다.",
  },
  {
    match: (_c, s) => /CLOSED|종결/i.test(s),
    suggestions: ["종결 확인서", "세금계산서", "결과 확정 문서 사본"],
    reasoning: "종결 단계에서는 결과 확인·정산 서류가 필요합니다.",
  },
];

function baseRuleSuggestions(category: string, status: string): {
  suggestions: string[];
  reasoning: string;
} {
  const hits = RULE_MAP.filter((r) => r.match(category, status));
  if (hits.length === 0) {
    return {
      suggestions: ["진행 상황 요약", "다음 일정 확인", "결과 예상 안내"],
      reasoning: "카테고리·단계 매칭 없음 — 일반적 후속 니즈 추정.",
    };
  }
  const merged = Array.from(new Set(hits.flatMap((h) => h.suggestions))).slice(0, 3);
  const reasoning = hits.map((h) => h.reasoning).join(" ");
  return { suggestions: merged, reasoning };
}

async function aiSuggestions(input: {
  title: string;
  category: string;
  status: string;
  summary?: string | null;
}): Promise<{ suggestions: string[]; reasoning: string; confidence: number } | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system:
          "You predict the next 3 documents/actions a Korean legal-administrative client will likely need next. Output ONLY JSON: {\"suggestions\": string[], \"reasoning\": string, \"confidence\": number}. Suggestions in Korean, 3 items, each ≤25 chars.",
        messages: [
          {
            role: "user",
            content: `사건: ${input.title}\n카테고리: ${input.category}\n상태: ${input.status}\n요약: ${input.summary ?? ""}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.content?.[0]?.text?.trim();
    const match = raw?.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as {
      suggestions?: unknown;
      reasoning?: unknown;
      confidence?: unknown;
    };
    if (!Array.isArray(parsed.suggestions)) return null;
    return {
      suggestions: parsed.suggestions.map(String).slice(0, 3),
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
    };
  } catch (err) {
    logger.warn("[needs-prediction] ai failed", err);
    return null;
  }
}

export async function predictNextNeeds(caseId: string): Promise<NeedsPrediction | null> {
  const cm = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      title: true,
      category: true,
      status: true,
      matterType: true,
      summary: true,
    },
  });
  if (!cm) return null;
  const category = `${cm.category ?? ""} ${cm.matterType ?? ""}`.trim();
  const status = String(cm.status ?? "");
  const rule = baseRuleSuggestions(category, status);
  const ai = await aiSuggestions({
    title: cm.title,
    category,
    status,
    summary: cm.summary,
  }).catch(() => null);
  if (ai && ai.suggestions.length > 0) {
    return {
      suggestions: Array.from(new Set([...ai.suggestions, ...rule.suggestions])).slice(0, 3),
      reasoning: `${ai.reasoning} · ${rule.reasoning}`.trim(),
      confidence: Math.max(ai.confidence, 0.6),
      source: "hybrid",
      predictedAt: new Date().toISOString(),
    };
  }
  return {
    suggestions: rule.suggestions,
    reasoning: rule.reasoning,
    confidence: 0.55,
    source: "rule",
    predictedAt: new Date().toISOString(),
  };
}

/** 제안 메시지 초안 (관리자가 고객에게 보낼 사전 안내). */
export function buildProposalDraft(clientName: string, suggestions: string[]): string {
  const items = suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n");
  return `${clientName} 님, 안녕하세요.\n\n다음 단계에서 아래 서류/조치가 필요할 수 있어 미리 안내드립니다.\n\n${items}\n\n필요하시면 준비 방법 안내드리겠습니다. 감사합니다.`;
}
