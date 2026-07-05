/**
 * AI 브레인스토밍 세션 — 난이도 높은 사건에 대한 전략 탐색.
 * 세션 저장: SiteSetting.key = "brainstorm.session.{caseId}"
 * 최근 20턴 유지.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type BrainstormMode = "3가지 접근법 제시" | "예상 반박 나열" | "단계별 실행 계획" | "자유";

export type BrainstormMessage = { role: "user" | "assistant"; content: string; at: string };

const SESSION_PREFIX = "brainstorm.session.";
const MAX_TURNS = 20;

export async function loadBrainstormSession(caseId: string): Promise<BrainstormMessage[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: `${SESSION_PREFIX}${caseId}` } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is BrainstormMessage =>
        m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant")
    );
  } catch {
    return [];
  }
}

async function saveBrainstormSession(caseId: string, messages: BrainstormMessage[]): Promise<void> {
  const trimmed = messages.slice(-MAX_TURNS * 2);
  const key = `${SESSION_PREFIX}${caseId}`;
  const value = JSON.stringify(trimmed);
  await prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

async function loadCaseContext(caseId: string): Promise<string> {
  try {
    const cm = await prisma.caseMatter.findUnique({
      where: { id: caseId },
      select: { title: true, summary: true, matterType: true, status: true }
    });
    if (!cm) return "";
    return `사건: ${cm.title}\n유형: ${cm.matterType} · 상태: ${cm.status}\n요약: ${cm.summary ?? ""}`;
  } catch {
    return "";
  }
}

function buildInstruction(mode: BrainstormMode): string {
  switch (mode) {
    case "3가지 접근법 제시":
      return "세 가지 서로 다른 전략 접근법을 각각 장단점과 함께 제시하라.";
    case "예상 반박 나열":
      return "예상되는 반박·리스크·상대측 주장을 목록화하고 대응 방향을 제시하라.";
    case "단계별 실행 계획":
      return "다음 30일 동안의 단계별 실행 계획을 주 단위로 나누어 제시하라.";
    default:
      return "";
  }
}

export async function brainstormTurn(
  caseId: string,
  message: string,
  mode: BrainstormMode = "자유"
): Promise<{ reply: string }> {
  const [context, history] = await Promise.all([loadCaseContext(caseId), loadBrainstormSession(caseId)]);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const userTurn: BrainstormMessage = { role: "user", content: message, at: new Date().toISOString() };
  const instruction = buildInstruction(mode);
  const composedUser = instruction ? `${instruction}\n\n${message}` : message;

  let reply = "AI 서비스가 설정되지 않았습니다.";
  if (apiKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          system: `You are a senior administrative attorney helping brainstorm strategy for a difficult case. Give sharp, structured, Korean advice.\n\n[사건 컨텍스트]\n${context}`,
          messages: [
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: composedUser }
          ]
        })
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const data = await res.json();
      reply = data.content?.[0]?.text ?? reply;
    } catch (err) {
      logger.error("[brainstorm] AI call failed", err);
      reply = "AI 호출에 실패했습니다.";
    }
  }

  const assistantTurn: BrainstormMessage = { role: "assistant", content: reply, at: new Date().toISOString() };
  await saveBrainstormSession(caseId, [...history, userTurn, assistantTurn]);
  return { reply };
}

export async function exportBrainstormSession(caseId: string): Promise<string> {
  const msgs = await loadBrainstormSession(caseId);
  return msgs.map((m) => `[${m.role === "user" ? "질문" : "AI"}] ${m.content}`).join("\n\n");
}
