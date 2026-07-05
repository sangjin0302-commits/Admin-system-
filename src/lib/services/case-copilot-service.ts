/**
 * AI 페어 코딩 파트너 (사건 진행 실시간 조언).
 *
 * 세션 저장: SiteSetting.key = "copilot.session.{caseId}"
 * 최근 30개 메시지 유지.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type CopilotMessage = { role: "user" | "assistant"; content: string; at: string };

export type CopilotAdvice = { reply: string; suggestions?: string[] };

const SESSION_PREFIX = "copilot.session.";
const MAX_MESSAGES = 30;

export async function loadCopilotSession(caseId: string): Promise<CopilotMessage[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: `${SESSION_PREFIX}${caseId}` } });
    if (!row?.value) return [];
    const parsed = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is CopilotMessage =>
        m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant")
    );
  } catch {
    return [];
  }
}

async function saveCopilotSession(caseId: string, messages: CopilotMessage[]): Promise<void> {
  const trimmed = messages.slice(-MAX_MESSAGES);
  const key = `${SESSION_PREFIX}${caseId}`;
  const value = JSON.stringify(trimmed);
  await prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

async function loadCaseContext(caseId: string): Promise<string> {
  try {
    const cm = await prisma.caseMatter.findUnique({
      where: { id: caseId },
      select: {
        title: true,
        caseNo: true,
        summary: true,
        matterType: true,
        status: true,
        dueDate: true,
        events: { orderBy: { createdAt: "desc" }, take: 5, select: { eventType: true, message: true } }
      }
    });
    if (!cm) return "";
    const lines: string[] = [
      `사건: ${cm.title} (${cm.caseNo ?? "-"})`,
      `유형: ${cm.matterType} · 상태: ${cm.status}`,
      cm.summary ? `요약: ${cm.summary}` : "",
      cm.dueDate ? `마감: ${cm.dueDate.toISOString().slice(0, 10)}` : "",
      "최근 이벤트:",
      ...cm.events.map((e) => `- [${e.eventType}] ${e.message ?? ""}`)
    ];
    return lines.filter(Boolean).join("\n");
  } catch (err) {
    logger.warn("[copilot] context load failed", err);
    return "";
  }
}

export async function getContextualAdvice(caseId: string, question: string): Promise<CopilotAdvice> {
  const [context, history] = await Promise.all([loadCaseContext(caseId), loadCopilotSession(caseId)]);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const userMsg: CopilotMessage = { role: "user", content: question, at: new Date().toISOString() };

  let reply = "AI 서비스가 설정되지 않았습니다. ANTHROPIC_API_KEY를 확인하세요.";

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
          max_tokens: 800,
          system: `You are a senior administrative attorney's AI copilot. Provide concise, actionable Korean advice grounded in the case context.\n\n[사건 컨텍스트]\n${context}`,
          messages: [
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: question }
          ]
        })
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const data = await res.json();
      reply = data.content?.[0]?.text ?? reply;
    } catch (err) {
      logger.error("[copilot] AI call failed", err);
      reply = "AI 호출에 실패했습니다.";
    }
  }

  const assistantMsg: CopilotMessage = { role: "assistant", content: reply, at: new Date().toISOString() };
  await saveCopilotSession(caseId, [...history, userMsg, assistantMsg]);
  return { reply, suggestions: ["다음 단계는?", "위험 요소는?", "유사 판례는?"] };
}
