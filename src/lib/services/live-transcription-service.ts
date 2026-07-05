/**
 * 실시간 통화 기록(Live transcription) 서비스.
 *
 * 브라우저는 Web Speech API 로 chunk 단위 텍스트를 서버에 전송.
 * 서버는 SiteSetting `livecall.session.{sessionId}` (JSON) 에 세션 상태 저장.
 * 세션 종료 시 Claude Haiku 로 요약 + 액션 아이템 + 카테고리 추정 + 견적 범위 도출.
 *
 * 브라우저 미지원 시: server-side Whisper 로 오디오 chunk 전사 가능 (voice-transcription-service 재사용).
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type LiveCallLanguage = "ko" | "en";

export interface LiveCallSession {
  id: string;
  language: LiveCallLanguage;
  startedAt: string;
  endedAt: string | null;
  chunks: Array<{ at: string; text: string }>;
  transcript: string;
  summary?: LiveCallSummary;
}

export interface LiveCallSummary {
  summary: string;
  actionItems: string[];
  suggestedCategory: string;
  estimatedQuoteRangeKrw: { min: number; max: number };
  provider: "claude-haiku" | "fallback";
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const settingKey = (sessionId: string) => `livecall.session.${sessionId}`;

export async function loadSession(sessionId: string): Promise<LiveCallSession | null> {
  const s = await prisma.siteSetting.findUnique({ where: { key: settingKey(sessionId) } });
  if (!s) return null;
  try {
    return JSON.parse(s.value) as LiveCallSession;
  } catch {
    return null;
  }
}

async function persist(session: LiveCallSession): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: settingKey(session.id) },
    create: { key: settingKey(session.id), value: JSON.stringify(session) },
    update: { value: JSON.stringify(session) }
  });
}

export async function startSession(language: LiveCallLanguage): Promise<LiveCallSession> {
  const id = `lc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const session: LiveCallSession = {
    id,
    language,
    startedAt: new Date().toISOString(),
    endedAt: null,
    chunks: [],
    transcript: ""
  };
  await persist(session);
  return session;
}

export async function appendChunk(sessionId: string, text: string): Promise<LiveCallSession> {
  const session = await loadSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (session.endedAt) throw new Error("Session already ended");
  const clean = text.trim();
  if (clean.length > 0) {
    session.chunks.push({ at: new Date().toISOString(), text: clean });
    session.transcript = session.transcript ? `${session.transcript}\n${clean}` : clean;
    await persist(session);
  }
  return session;
}

function fallbackSummary(transcript: string, lang: LiveCallLanguage): LiveCallSummary {
  const excerpt = transcript.slice(0, 300);
  return {
    summary: lang === "ko" ? `통화 요약(자동): ${excerpt}` : `Call summary (auto): ${excerpt}`,
    actionItems: [lang === "ko" ? "고객에게 확정 견적서 전송" : "Send finalized quote to client"],
    suggestedCategory: "UNKNOWN",
    estimatedQuoteRangeKrw: { min: 300_000, max: 800_000 },
    provider: "fallback"
  };
}

async function summarizeWithClaude(
  apiKey: string,
  transcript: string,
  lang: LiveCallLanguage
): Promise<LiveCallSummary> {
  const prompt = `You are analyzing a live consultation call transcript for a Korean administrative agent (행정사) office.

Transcript language: ${lang === "ko" ? "Korean" : "English"}
Transcript:
"""
${transcript.slice(0, 8000)}
"""

Extract:
1. summary — 2-4 sentence summary in ${lang === "ko" ? "Korean" : "English"}
2. actionItems — array of concrete next actions (max 6)
3. suggestedCategory — one of: FOREIGNER_VISA, IMMIGRATION_STAY, APOSTILLE_CONSULAR, TRANSLATION_NOTARY, GENERAL_ADMIN_CIVIL, CORPORATE_REQUEST, UNKNOWN
4. estimatedQuoteRangeKrw — {min, max} in KRW integers (rough range based on complexity)

Respond as JSON only:
{"summary":"...","actionItems":["..."],"suggestedCategory":"...","estimatedQuoteRangeKrw":{"min":0,"max":0}}`;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");
  const parsed = JSON.parse(match[0]) as Partial<LiveCallSummary> & { estimatedQuoteRangeKrw?: { min?: unknown; max?: unknown } };

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
    actionItems: Array.isArray(parsed.actionItems)
      ? parsed.actionItems.filter((s): s is string => typeof s === "string").slice(0, 10)
      : [],
    suggestedCategory: typeof parsed.suggestedCategory === "string" ? parsed.suggestedCategory : "UNKNOWN",
    estimatedQuoteRangeKrw: {
      min: typeof parsed.estimatedQuoteRangeKrw?.min === "number" ? Math.max(0, Math.floor(parsed.estimatedQuoteRangeKrw.min)) : 0,
      max: typeof parsed.estimatedQuoteRangeKrw?.max === "number" ? Math.max(0, Math.floor(parsed.estimatedQuoteRangeKrw.max)) : 0
    },
    provider: "claude-haiku"
  };
}

export async function endSession(sessionId: string): Promise<LiveCallSession> {
  const session = await loadSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  session.endedAt = new Date().toISOString();
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || session.transcript.trim().length < 10) {
    session.summary = fallbackSummary(session.transcript, session.language);
  } else {
    try {
      session.summary = await summarizeWithClaude(apiKey, session.transcript, session.language);
    } catch (err) {
      logger.warn("[live-transcription] Claude summary failed, falling back", err);
      session.summary = fallbackSummary(session.transcript, session.language);
    }
  }
  await persist(session);
  return session;
}

export interface CreateInquiryFromCallInput {
  sessionId: string;
  contactName: string;
  email: string;
  phone?: string;
}

export async function createInquiryFromCall(input: CreateInquiryFromCallInput): Promise<{ inquiryId: string }> {
  const session = await loadSession(input.sessionId);
  if (!session || !session.summary) throw new Error("Session not ended or summary missing");

  const inquiry = await prisma.inquiry.create({
    data: {
      contactName: input.contactName || "통화 상담 고객",
      email: input.email || "unknown@example.com",
      phone: input.phone ?? null,
      title: session.summary.summary.slice(0, 80) || "실시간 통화 상담 요약",
      description: session.transcript.slice(0, 8000),
      generatedSummary: session.summary.summary,
      generatedGuidance: session.summary.actionItems.join("\n") || "-",
      generatedReceiptMessage: "실시간 통화 기록 기반 자동 생성",
      classificationReason: `추정 카테고리: ${session.summary.suggestedCategory}`,
      recommendedNextStep: session.summary.actionItems[0] ?? "확정 견적서 전달",
      internalMemo: [
        "[실시간 통화 기록]",
        `세션 ID: ${session.id}`,
        `언어: ${session.language}`,
        `시작: ${session.startedAt}`,
        `종료: ${session.endedAt ?? ""}`,
        "",
        "[액션 아이템]",
        ...session.summary.actionItems.map((a) => `- ${a}`),
        "",
        `추정 견적 범위: ${session.summary.estimatedQuoteRangeKrw.min.toLocaleString()} ~ ${session.summary.estimatedQuoteRangeKrw.max.toLocaleString()} 원`
      ].join("\n"),
      preferredLanguage: session.language === "ko" ? "KO" : "EN"
    },
    select: { id: true }
  });
  return { inquiryId: inquiry.id };
}
