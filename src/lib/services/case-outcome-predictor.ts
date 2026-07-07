/**
 * 사건 승소·패소 위험 평가.
 *
 * - 사건 카테고리·사실관계·적용 법령·판례를 바탕으로 Claude Sonnet 판단 + 휴리스틱 병합.
 * - 결과 저장: SiteSetting key = "outcome.predict.<caseId>"
 * - 유사 과거 사건은 `case-story-search-service`에서 재사용.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";
import { searchCaseStories, type CaseMatch } from "@/lib/services/case-story-search-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

const KEY_PREFIX = "outcome.predict.";

export type OutcomePrediction = {
  caseId: string;
  successProbability: number; // 0-1
  confidence: number; // 0-1
  keyFactors: string[];
  riskFactors: string[];
  similarPastCases: Array<{ slug: string; title: string; outcome: string }>;
  recommendation: string;
  source: "ai" | "heuristic";
  reasoning: string;
  predictedAt: string;
};

type CaseSnapshot = {
  id: string;
  title: string;
  summary: string;
  matterType: string;
  category: string;
  status: string;
  riskLevel: string;
  requiredDocsTotal: number;
  requiredDocsCollected: number;
  hasEvidenceSummary: boolean;
  dueDate: Date | null;
};

function outcomeKey(caseId: string): string {
  return `${KEY_PREFIX}${caseId}`;
}

async function loadCaseSnapshot(caseId: string): Promise<CaseSnapshot | null> {
  const c = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      title: true,
      summary: true,
      matterType: true,
      category: true,
      status: true,
      riskLevel: true,
      dueDate: true,
      requiredDocuments: {
        select: { status: true },
      },
      adminAppealDetail: {
        select: { evidenceSummary: true },
      },
    },
  });
  if (!c) return null;
  return {
    id: c.id,
    title: c.title,
    summary: c.summary ?? "",
    matterType: c.matterType,
    category: String(c.category),
    status: String(c.status),
    riskLevel: String(c.riskLevel),
    requiredDocsTotal: c.requiredDocuments.length,
    requiredDocsCollected: c.requiredDocuments.filter((d) => String(d.status) === "RECEIVED" || String(d.status) === "APPROVED").length,
    hasEvidenceSummary: Boolean(c.adminAppealDetail?.evidenceSummary),
    dueDate: c.dueDate,
  };
}

function heuristicPredict(snap: CaseSnapshot, similar: CaseMatch[]): OutcomePrediction {
  let base = 0.5;
  const key: string[] = [];
  const risks: string[] = [];

  // Evidence readiness
  if (snap.requiredDocsTotal > 0) {
    const ratio = snap.requiredDocsCollected / snap.requiredDocsTotal;
    if (ratio >= 0.8) {
      base += 0.12;
      key.push(`필수 서류 ${Math.round(ratio * 100)}% 확보`);
    } else if (ratio < 0.4) {
      base -= 0.1;
      risks.push(`필수 서류 미확보 (${Math.round(ratio * 100)}%)`);
    }
  }
  if (snap.hasEvidenceSummary) {
    base += 0.05;
    key.push("증거 요약 정리됨");
  } else {
    risks.push("증거 요약 미작성");
  }

  // Risk level
  if (snap.riskLevel === "LOW") {
    base += 0.08;
    key.push("낮은 리스크 판단");
  } else if (snap.riskLevel === "HIGH" || snap.riskLevel === "CRITICAL") {
    base -= 0.12;
    risks.push("사건 자체 리스크가 높음");
  }

  // Deadline pressure
  if (snap.dueDate) {
    const days = (snap.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    if (days < 3 && days >= 0) risks.push(`마감 임박 (D-${Math.max(0, Math.round(days))})`);
    else if (days < 0) risks.push("마감 지남");
  }

  // Precedent alignment
  if (similar.length >= 3) {
    base += 0.08;
    key.push(`유사 성공사례 ${similar.length}건 확인`);
  } else if (similar.length === 0) {
    risks.push("유사 참고 사례 부족");
  }

  base = Math.max(0.05, Math.min(0.95, base));
  const recommendation =
    base >= 0.7
      ? "적극 수행 — 승소 가능성 높음. 절차 준수 및 증거 정합성 유지."
      : base >= 0.5
      ? "일반 수행 — 리스크 요인 해소 후 진행 권장."
      : "신중 검토 — 조건부 수임/거절 대안 고려 및 리스크 사전 안내.";

  return {
    caseId: snap.id,
    successProbability: base,
    confidence: 0.55,
    keyFactors: key.slice(0, 3),
    riskFactors: risks.slice(0, 3),
    similarPastCases: similar.slice(0, 3).map((s) => ({ slug: s.slug, title: s.title, outcome: s.outcome })),
    recommendation,
    source: "heuristic",
    reasoning: "휴리스틱 기반 (서류 확보율·리스크 등급·유사사례·마감).",
    predictedAt: new Date().toISOString(),
  };
}

async function aiPredict(
  apiKey: string,
  snap: CaseSnapshot,
  similar: CaseMatch[]
): Promise<OutcomePrediction | null> {
  const similarText = similar
    .slice(0, 5)
    .map((s, i) => `${i + 1}. ${s.title} — ${s.outcome}`)
    .join("\n");

  const prompt = `You are assessing an administrative agent (행정사) case's success probability.
Return ONLY JSON:
{"successProbability":0-1,"confidence":0-1,"keyFactors":["..."],"riskFactors":["..."],"recommendation":"한국어 1-2문장","reasoning":"한국어 1-2문장"}

Case:
Title: ${snap.title}
Type: ${snap.matterType}
Category: ${snap.category}
Status: ${snap.status}
RiskLevel: ${snap.riskLevel}
DueDate: ${snap.dueDate?.toISOString() ?? "none"}
Docs collected: ${snap.requiredDocsCollected}/${snap.requiredDocsTotal}
EvidenceSummary: ${snap.hasEvidenceSummary ? "present" : "absent"}
Summary: ${snap.summary.slice(0, 1200)}

Similar past cases:
${similarText || "(none)"}
`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]);

  const clamp01 = (n: unknown) => {
    const v = typeof n === "number" ? n : Number(n);
    if (!Number.isFinite(v)) return 0.5;
    return Math.max(0, Math.min(1, v));
  };
  const asStrArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 5) : [];

  return {
    caseId: snap.id,
    successProbability: clamp01(parsed.successProbability),
    confidence: clamp01(parsed.confidence),
    keyFactors: asStrArr(parsed.keyFactors),
    riskFactors: asStrArr(parsed.riskFactors),
    similarPastCases: similar.slice(0, 3).map((s) => ({ slug: s.slug, title: s.title, outcome: s.outcome })),
    recommendation: typeof parsed.recommendation === "string" ? parsed.recommendation : "",
    source: "ai",
    reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "AI 판단",
    predictedAt: new Date().toISOString(),
  };
}

export async function getStoredOutcomePrediction(caseId: string): Promise<OutcomePrediction | null> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: outcomeKey(caseId) } });
    if (!row?.value) return null;
    const parsed = JSON.parse(row.value);
    if (typeof parsed?.successProbability === "number") return parsed as OutcomePrediction;
    return null;
  } catch {
    return null;
  }
}

async function storePrediction(pred: OutcomePrediction): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: outcomeKey(pred.caseId) },
    create: { key: outcomeKey(pred.caseId), value: JSON.stringify(pred) },
    update: { value: JSON.stringify(pred) },
  });
}

export async function predictCaseOutcome(caseId: string): Promise<OutcomePrediction> {
  const enabled = await isFeatureEnabled("outcome_predictor");
  if (!enabled) throw new Error("outcome_predictor 기능이 비활성화되어 있습니다.");

  const snap = await loadCaseSnapshot(caseId);
  if (!snap) throw new Error("사건을 찾을 수 없습니다.");

  const query = [snap.title, snap.summary].join(" ").trim();
  let similar: CaseMatch[] = [];
  try {
    similar = await searchCaseStories(query, 8);
  } catch (err) {
    logger.warn("[outcome-predictor] 유사사례 검색 실패", err);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let pred: OutcomePrediction | null = null;
  if (apiKey) {
    try {
      pred = await aiPredict(apiKey, snap, similar);
    } catch (err) {
      logger.warn("[outcome-predictor] AI 실패 — heuristic fallback", err);
    }
  }
  if (!pred) pred = heuristicPredict(snap, similar);

  await storePrediction(pred);
  return pred;
}
