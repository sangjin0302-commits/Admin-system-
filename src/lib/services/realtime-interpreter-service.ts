/**
 * 다국어 실시간 통역 — 상담시 KO 관리자 ↔ 비-KO 고객.
 * Claude Haiku 로 번역, 세션은 in-memory (SSE 스트리밍용).
 */

import { logger } from "@/lib/utils/logger";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export type Lang = "ko" | "en" | "zh" | "vi";

export const SUPPORTED_LANGS: Lang[] = ["ko", "en", "zh", "vi"];

export const LANG_LABELS: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  zh: "中文",
  vi: "Tiếng Việt",
};

export type InterpreterTurn = {
  id: string;
  sessionId: string;
  speaker: "admin" | "client";
  sourceLang: Lang;
  targetLang: Lang;
  sourceText: string;
  translatedText: string;
  createdAt: string;
};

export type InterpreterSession = {
  id: string;
  adminLang: Lang;
  clientLang: Lang;
  caseId?: string;
  createdAt: string;
  turns: InterpreterTurn[];
};

const sessions = new Map<string, InterpreterSession>();

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function createSession(input: {
  adminLang: Lang;
  clientLang: Lang;
  caseId?: string;
}): InterpreterSession {
  const session: InterpreterSession = {
    id: newId("ses"),
    adminLang: input.adminLang,
    clientLang: input.clientLang,
    caseId: input.caseId,
    createdAt: new Date().toISOString(),
    turns: [],
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): InterpreterSession | null {
  return sessions.get(id) ?? null;
}

export function endSession(id: string): InterpreterSession | null {
  const s = sessions.get(id) ?? null;
  if (s) sessions.delete(id);
  return s;
}

export function listSessions(): InterpreterSession[] {
  return [...sessions.values()];
}

const LANG_INSTR: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  zh: "简体中文",
  vi: "Tiếng Việt",
};

/**
 * Claude Haiku 로 번역. 실패 시 null.
 * 사무·법률 도메인이므로 존칭·정확성 유지.
 */
export async function translateText(
  text: string,
  from: Lang,
  to: Lang
): Promise<string | null> {
  if (from === to) return text;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.warn("[interpreter] ANTHROPIC_API_KEY not set");
    return null;
  }
  const system = `You are a professional administrative/legal consultation interpreter. Translate the user's text from ${LANG_INSTR[from]} to ${LANG_INSTR[to]}. Preserve nuance, keep formal register, keep proper nouns intact. Output ONLY the translated text — no quotes, no commentary, no prefix.`;
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: text }],
      }),
    });
    if (!res.ok) {
      logger.warn("[interpreter] api error", { status: res.status });
      return null;
    }
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const out = data.content?.find((c) => c.type === "text")?.text?.trim();
    return out ?? null;
  } catch (err) {
    logger.error("[interpreter] translate failed", err);
    return null;
  }
}

export async function addTurn(
  sessionId: string,
  speaker: "admin" | "client",
  sourceText: string
): Promise<InterpreterTurn | null> {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const sourceLang = speaker === "admin" ? session.adminLang : session.clientLang;
  const targetLang = speaker === "admin" ? session.clientLang : session.adminLang;
  const translated = (await translateText(sourceText, sourceLang, targetLang)) ?? sourceText;
  const turn: InterpreterTurn = {
    id: newId("trn"),
    sessionId,
    speaker,
    sourceLang,
    targetLang,
    sourceText,
    translatedText: translated,
    createdAt: new Date().toISOString(),
  };
  session.turns.push(turn);
  return turn;
}
