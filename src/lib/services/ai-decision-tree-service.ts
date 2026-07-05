/**
 * AI 의사결정 트리 — 각 사건 단계에서 다음 액션을 AI(Claude Haiku)가 추천.
 *
 * 액션 집합(고정): request_docs | send_reminder | schedule_meeting | draft_document | close_case | escalate
 *
 * 학습용 피드백 저장: SiteSetting key = "ai_decision.feedback.<caseId>"
 *   value: JSON.stringify([{ action, verdict: "accepted"|"rejected", at }])
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const FEEDBACK_KEY_PREFIX = "ai_decision.feedback.";

export type DecisionAction =
  | "request_docs"
  | "send_reminder"
  | "schedule_meeting"
  | "draft_document"
  | "close_case"
  | "escalate";

export type DecisionRecommendation = {
  action: DecisionAction;
  confidence: number;
  reasoning: string;
  params: Record<string, string>;
};

export type NextActionResult = {
  caseId: string;
  top: DecisionRecommendation;
  alternates: DecisionRecommendation[];
  generatedAt: string;
};

const ACTION_LABELS: Record<DecisionAction, string> = {
  request_docs: "서류 요청",
  send_reminder: "리마인더 발송",
  schedule_meeting: "미팅 예약",
  draft_document: "서면 초안 작성",
  close_case: "사건 종결",
  escalate: "에스컬레이션",
};

export function getActionLabel(a: DecisionAction): string {
  return ACTION_LABELS[a] ?? a;
}

function heuristicRecs(caseSnapshot: CaseSnapshot): DecisionRecommendation[] {
  const recs: DecisionRecommendation[] = [];
  const missingDocs = caseSnapshot.missingRequiredDocs;
  const daysUntilDue = caseSnapshot.daysUntilDue;
  const openTasks = caseSnapshot.openTaskCount;
  const staleDays = caseSnapshot.daysSinceLastEvent;

  if (missingDocs > 0) {
    recs.push({
      action: "request_docs",
      confidence: Math.min(0.95, 0.6 + missingDocs * 0.1),
      reasoning: `필수 서류 ${missingDocs}건 미제출`,
      params: { count: String(missingDocs) },
    });
  }
  if (daysUntilDue !== null && daysUntilDue <= 5 && daysUntilDue >= 0) {
    recs.push({
      action: "send_reminder",
      confidence: 0.85,
      reasoning: `마감 D-${daysUntilDue} 임박`,
      params: { days: String(daysUntilDue) },
    });
  }
  if (openTasks > 0 && staleDays > 7) {
    recs.push({
      action: "schedule_meeting",
      confidence: 0.7,
      reasoning: `열린 업무 ${openTasks}건 · 최근 진행 없음 (${staleDays}일)`,
      params: { openTasks: String(openTasks) },
    });
  }
  if (caseSnapshot.category === "ADMIN_APPEAL" || caseSnapshot.category === "VISA_STAY") {
    recs.push({
      action: "draft_document",
      confidence: 0.6,
      reasoning: "행정심판/체류 카테고리는 서면 준비가 핵심 액션",
      params: { template: caseSnapshot.category },
    });
  }
  if (caseSnapshot.status === "CLOSED" || caseSnapshot.status === "CLOSING") {
    recs.push({ action: "close_case", confidence: 0.95, reasoning: "이미 종결 단계", params: {} });
  }
  if (staleDays > 21) {
    recs.push({ action: "escalate", confidence: 0.65, reasoning: `${staleDays}일간 진행 정체`, params: {} });
  }
  if (recs.length === 0) {
    recs.push({ action: "send_reminder", confidence: 0.4, reasoning: "특이 사항 없음 - 진행 상황 확인 권장", params: {} });
  }
  return recs.sort((a, b) => b.confidence - a.confidence);
}

type CaseSnapshot = {
  category: string | null;
  status: string;
  daysUntilDue: number | null;
  daysSinceLastEvent: number;
  openTaskCount: number;
  missingRequiredDocs: number;
  title: string;
  summary: string | null;
};

async function buildSnapshot(caseId: string): Promise<CaseSnapshot | null> {
  const c = await prisma.caseMatter.findUnique({
    where: { id: caseId },
    select: {
      title: true,
      summary: true,
      category: true,
      status: true,
      dueDate: true,
      requiredDocuments: { select: { status: true } },
      tasks: { select: { status: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });
  if (!c) return null;
  const now = Date.now();
  const daysUntilDue = c.dueDate ? Math.floor((c.dueDate.getTime() - now) / 86_400_000) : null;
  const lastAt = c.events[0]?.createdAt?.getTime() ?? now;
  const daysSinceLastEvent = Math.floor((now - lastAt) / 86_400_000);
  const openTaskCount = c.tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length;
  const missingRequiredDocs = c.requiredDocuments.filter((d) => d.status !== "APPROVED" && d.status !== "RECEIVED").length;
  return {
    category: c.category,
    status: c.status,
    daysUntilDue,
    daysSinceLastEvent,
    openTaskCount,
    missingRequiredDocs,
    title: c.title,
    summary: c.summary,
  };
}

async function aiRefine(snapshot: CaseSnapshot, heuristic: DecisionRecommendation[]): Promise<DecisionRecommendation[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return heuristic;

  const allowed: DecisionAction[] = ["request_docs", "send_reminder", "schedule_meeting", "draft_document", "close_case", "escalate"];
  const prompt = `사건 상태에 맞는 다음 액션 3개를 JSON 배열로 추천. 액션은 다음 중에서만: ${allowed.join(", ")}.

사건: ${snapshot.title}
요약: ${snapshot.summary?.slice(0, 300) ?? "없음"}
카테고리: ${snapshot.category ?? "미분류"}
상태: ${snapshot.status}
마감까지: ${snapshot.daysUntilDue ?? "없음"}일
미제출 필수서류: ${snapshot.missingRequiredDocs}건
열린 업무: ${snapshot.openTaskCount}건
최근 진행 없음: ${snapshot.daysSinceLastEvent}일

응답 JSON만:
[{"action":"...","confidence":0-1,"reasoning":"한국어 1문장","params":{}}, ...]`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("no array");
    const arr = JSON.parse(match[0]) as Array<{ action: string; confidence: number; reasoning: string; params?: Record<string, string> }>;
    const out: DecisionRecommendation[] = [];
    for (const r of arr) {
      if (!allowed.includes(r.action as DecisionAction)) continue;
      out.push({
        action: r.action as DecisionAction,
        confidence: Math.max(0, Math.min(1, r.confidence)),
        reasoning: r.reasoning || "AI 판단",
        params: r.params ?? {},
      });
    }
    return out.length > 0 ? out.sort((a, b) => b.confidence - a.confidence) : heuristic;
  } catch (err) {
    logger.warn("[decision-tree] AI 실패 - heuristic fallback", err);
    return heuristic;
  }
}

export async function getNextAction(caseId: string): Promise<NextActionResult | null> {
  const snapshot = await buildSnapshot(caseId);
  if (!snapshot) return null;
  const heuristic = heuristicRecs(snapshot);
  const refined = await aiRefine(snapshot, heuristic);
  return {
    caseId,
    top: refined[0],
    alternates: refined.slice(1, 3),
    generatedAt: new Date().toISOString(),
  };
}

export async function recordFeedback(caseId: string, action: DecisionAction, verdict: "accepted" | "rejected"): Promise<void> {
  const key = `${FEEDBACK_KEY_PREFIX}${caseId}`;
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  const arr: Array<{ action: DecisionAction; verdict: "accepted" | "rejected"; at: string }> = row?.value
    ? (JSON.parse(row.value) as Array<{ action: DecisionAction; verdict: "accepted" | "rejected"; at: string }>)
    : [];
  arr.push({ action, verdict, at: new Date().toISOString() });
  const trimmed = arr.slice(-50);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(trimmed) },
    update: { value: JSON.stringify(trimmed) },
  });
}
