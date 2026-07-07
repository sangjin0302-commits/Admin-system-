/**
 * 답변 문안 A/B 비교.
 *
 * 두 텍스트를 비교하여 명료성/톤/설득력/법률 정확도/길이 효율 점수화.
 * Claude Sonnet 사용, 실패 시 휴리스틱 fallback.
 * 합성 초안(synthesis)은 요청 시 별도로 생성.
 */

import { logger } from "@/lib/utils/logger";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export type TextABContext = {
  audience?: "client" | "court" | "internal" | "public";
  purpose?: string; // 자유 서술 (예: "의뢰인에게 지연 사유 안내")
};

export type TextScore = {
  clarity: number; // 0-100
  toneAppropriateness: number;
  persuasiveness: number;
  legalAccuracy: number;
  lengthEfficiency: number;
  overall: number;
};

export type TextABResult = {
  scoreA: TextScore;
  scoreB: TextScore;
  winner: "A" | "B" | "tie";
  strengthsA: string[];
  weaknessesA: string[];
  strengthsB: string[];
  weaknessesB: string[];
  synthesis: string;
  source: "ai" | "heuristic";
  comparedAt: string;
};

function heuristicScore(text: string): TextScore {
  const len = text.trim().length;
  const sentences = text.split(/[.。!?！？]/).filter((s) => s.trim().length > 0);
  const avgSentence = sentences.length ? len / sentences.length : len;

  // Clarity: sentence length ~40-80 자 최적
  let clarity = 60;
  if (avgSentence > 30 && avgSentence < 90) clarity += 20;
  else if (avgSentence > 120) clarity -= 15;

  // Tone appropriateness: 존댓말/공손 표현 감지
  const politeMarkers = ["습니다", "니다", "드립니다", "부탁드립니다", "안녕하세요"];
  const politeHits = politeMarkers.filter((m) => text.includes(m)).length;
  const tone = Math.min(100, 40 + politeHits * 12);

  // Persuasiveness: 근거·수치·법조문 언급
  const persuasiveMarkers = ["따라서", "왜냐하면", "제\\d+조", "판례", "법령", "%"];
  const persuasiveHits = persuasiveMarkers.filter((m) => new RegExp(m).test(text)).length;
  const persuasive = Math.min(100, 40 + persuasiveHits * 12);

  // Legal accuracy: 법령·조문 언급 여부 (proxy)
  const legalHits = /법령|법률|조항|판례|조례|시행령/.test(text) ? 20 : 0;
  const legal = Math.min(100, 55 + legalHits);

  // Length efficiency: 200-800자 최적
  let lengthEff = 60;
  if (len >= 200 && len <= 800) lengthEff = 85;
  else if (len < 100) lengthEff = 40;
  else if (len > 1500) lengthEff = 45;

  const overall = Math.round(
    0.25 * clarity + 0.2 * tone + 0.2 * persuasive + 0.2 * legal + 0.15 * lengthEff
  );
  return {
    clarity: Math.round(clarity),
    toneAppropriateness: Math.round(tone),
    persuasiveness: Math.round(persuasive),
    legalAccuracy: Math.round(legal),
    lengthEfficiency: Math.round(lengthEff),
    overall,
  };
}

function heuristicCompare(textA: string, textB: string): TextABResult {
  const scoreA = heuristicScore(textA);
  const scoreB = heuristicScore(textB);
  const diff = scoreA.overall - scoreB.overall;
  const winner: "A" | "B" | "tie" = Math.abs(diff) < 3 ? "tie" : diff > 0 ? "A" : "B";
  return {
    scoreA,
    scoreB,
    winner,
    strengthsA: [],
    weaknessesA: [],
    strengthsB: [],
    weaknessesB: [],
    synthesis: "휴리스틱 모드에서는 합성 초안을 제공하지 않습니다. AI 키 설정 시 합성 초안이 생성됩니다.",
    source: "heuristic",
    comparedAt: new Date().toISOString(),
  };
}

async function aiCompare(
  apiKey: string,
  textA: string,
  textB: string,
  context: TextABContext
): Promise<TextABResult | null> {
  const audience = context.audience ?? "client";
  const purpose = context.purpose ?? "일반 답변";
  const prompt = `You are comparing two Korean draft messages for an administrative agent (행정사).

Context:
Audience: ${audience}
Purpose: ${purpose}

Score each on 0-100 for: clarity, toneAppropriateness, persuasiveness, legalAccuracy, lengthEfficiency.
Return ONLY JSON:
{
  "scoreA": {"clarity":0-100,"toneAppropriateness":0-100,"persuasiveness":0-100,"legalAccuracy":0-100,"lengthEfficiency":0-100,"overall":0-100},
  "scoreB": {"clarity":0-100,"toneAppropriateness":0-100,"persuasiveness":0-100,"legalAccuracy":0-100,"lengthEfficiency":0-100,"overall":0-100},
  "winner": "A" | "B" | "tie",
  "strengthsA": ["..."],
  "weaknessesA": ["..."],
  "strengthsB": ["..."],
  "weaknessesB": ["..."],
  "synthesis": "두 문안의 강점을 결합한 최적 초안 (한국어, 완전한 문장)"
}

Text A:
${textA.slice(0, 3500)}

Text B:
${textB.slice(0, 3500)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]);

  const clamp = (n: unknown) => {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(100, Math.round(v)));
  };
  const asScore = (obj: unknown): TextScore => {
    const o = (obj ?? {}) as Record<string, unknown>;
    const s: TextScore = {
      clarity: clamp(o.clarity),
      toneAppropriateness: clamp(o.toneAppropriateness),
      persuasiveness: clamp(o.persuasiveness),
      legalAccuracy: clamp(o.legalAccuracy),
      lengthEfficiency: clamp(o.lengthEfficiency),
      overall: 0,
    };
    s.overall = clamp(
      o.overall ??
        0.25 * s.clarity +
          0.2 * s.toneAppropriateness +
          0.2 * s.persuasiveness +
          0.2 * s.legalAccuracy +
          0.15 * s.lengthEfficiency
    );
    return s;
  };
  const asStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 6) : [];

  const winnerRaw = parsed.winner;
  const winner: "A" | "B" | "tie" =
    winnerRaw === "A" || winnerRaw === "B" || winnerRaw === "tie" ? winnerRaw : "tie";

  return {
    scoreA: asScore(parsed.scoreA),
    scoreB: asScore(parsed.scoreB),
    winner,
    strengthsA: asStrArr(parsed.strengthsA),
    weaknessesA: asStrArr(parsed.weaknessesA),
    strengthsB: asStrArr(parsed.strengthsB),
    weaknessesB: asStrArr(parsed.weaknessesB),
    synthesis: typeof parsed.synthesis === "string" ? parsed.synthesis : "",
    source: "ai",
    comparedAt: new Date().toISOString(),
  };
}

export async function compareTextsAB(
  textA: string,
  textB: string,
  context: TextABContext = {}
): Promise<TextABResult> {
  const enabled = await isFeatureEnabled("text_ab_compare");
  if (!enabled) throw new Error("text_ab_compare 기능이 비활성화되어 있습니다.");
  if (!textA.trim() || !textB.trim()) throw new Error("두 문안을 모두 입력해 주세요.");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const ai = await aiCompare(apiKey, textA, textB, context);
      if (ai) return ai;
    } catch (err) {
      logger.warn("[text-ab-compare] AI 실패 — heuristic fallback", err);
    }
  }
  return heuristicCompare(textA, textB);
}
