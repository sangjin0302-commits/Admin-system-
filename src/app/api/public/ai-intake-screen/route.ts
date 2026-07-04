/**
 * 초기 상담 사전 진단 API.
 * 5문항 응답을 Anthropic Haiku 에 넘겨 구조화된 결과 JSON을 반환한다.
 * API 키 미설정 시 규칙 기반 폴백 결과를 반환.
 */

import { NextResponse } from "next/server";

import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/security/rate-limit";
import { logger } from "@/lib/utils/logger";

export const maxDuration = 30;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

type Answers = {
  category?: string;
  timing?: string;
  documents?: string;
  goal?: string;
  budget?: string;
};

type ScreenResult = {
  confidence: number; // 0..100
  category: string;
  estimateMin: number;
  estimateMax: number;
  currency: "KRW";
  requiredDocuments: string[];
  procedure: string[]; // 3단계
  summary: string;
};

const SYSTEM_PROMPT = `당신은 한국 행정사 사무소의 초기 상담 스크리너입니다.
사용자의 5가지 답변(사안 카테고리, 발생 시점, 문서 유무, 목표 시점, 예산)을 받아
JSON 하나만 출력합니다. 마크다운, 코드펜스 없이 순수 JSON.

스키마:
{
  "confidence": 55, // 0-100 정수, 초기 스크리닝 신뢰도
  "category": "비자/체류",
  "estimateMin": 300000, // 원 단위 정수
  "estimateMax": 800000,
  "currency": "KRW",
  "requiredDocuments": ["여권 사본", "체류지 증명"],
  "procedure": ["1단계 …", "2단계 …", "3단계 …"],
  "summary": "한 문단, 3~5문장, 존댓말"
}
requiredDocuments 는 3~6개, procedure 는 정확히 3개. 절대 상담 확정을 약속하지 말고,
"예상"·"참고" 어투를 사용하세요. 예상 견적은 예산 답변과 카테고리를 반영하되 상단은 하한의 2~4배로.`;

function parseAnswers(payload: unknown): Answers | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as Record<string, unknown>;
  const pick = (k: string): string | undefined => {
    const v = raw[k];
    return typeof v === "string" && v.trim() ? v.trim().slice(0, 60) : undefined;
  };
  return {
    category: pick("category"),
    timing: pick("timing"),
    documents: pick("documents"),
    goal: pick("goal"),
    budget: pick("budget")
  };
}

function fallbackResult(answers: Answers): ScreenResult {
  const catMap: Record<string, { label: string; min: number; max: number; docs: string[] }> = {
    visa: {
      label: "비자/체류",
      min: 300000,
      max: 900000,
      docs: ["여권 사본", "체류지 증명", "재정 증빙", "신청 사유서"]
    },
    appeal: {
      label: "행정심판",
      min: 800000,
      max: 3000000,
      docs: ["처분서", "관련 통지문", "당사자 진술서", "증빙 자료"]
    },
    contract: {
      label: "계약서 · 사실조사",
      min: 300000,
      max: 1500000,
      docs: ["관련 계약서 초안", "당사자 신원자료", "쟁점 정리 메모"]
    },
    license: {
      label: "인허가",
      min: 500000,
      max: 2000000,
      docs: ["사업 개요", "부지/시설 자료", "관련 도면", "임대차 서류"]
    },
    corporate: {
      label: "법인 설립",
      min: 700000,
      max: 2500000,
      docs: ["정관 초안", "발기인 명단", "본점 소재지 확인", "출자 증빙"]
    }
  };
  const key = (answers.category ?? "visa").toLowerCase();
  const c = catMap[key] ?? catMap.visa;
  // 예산에 따라 상한 조정
  let max = c.max;
  const b = (answers.budget ?? "").toLowerCase();
  if (b === "50" || b === "under50") max = Math.min(max, 800000);
  else if (b === "100" || b === "under100") max = Math.min(max, 1500000);
  else if (b === "300" || b === "under300") max = Math.min(max, 3500000);
  return {
    confidence: 55,
    category: c.label,
    estimateMin: c.min,
    estimateMax: max,
    currency: "KRW",
    requiredDocuments: c.docs,
    procedure: [
      "1단계 · 상담: 무료 검토 요청서 접수 후 24시간 내 회신",
      "2단계 · 서류 준비: 필요 서류 안내 및 초안 검토",
      "3단계 · 진행: 신청서 제출 · 결과 안내"
    ],
    summary:
      "입력하신 정보를 바탕으로 예상 절차와 견적 범위를 참고용으로 안내드립니다. 실제 견적과 절차는 상세 상담 후 확정됩니다."
  };
}

function coerceResult(raw: unknown, answers: Answers): ScreenResult {
  const fb = fallbackResult(answers);
  if (!raw || typeof raw !== "object") return fb;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  const str = (v: unknown, d: string) => (typeof v === "string" && v.trim() ? v.trim() : d);
  const arr = (v: unknown, d: string[]): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 8)
      : d;
  const procedure = arr(r.procedure, fb.procedure);
  return {
    confidence: Math.max(0, Math.min(100, Math.round(num(r.confidence, fb.confidence)))),
    category: str(r.category, fb.category),
    estimateMin: Math.max(0, Math.round(num(r.estimateMin, fb.estimateMin))),
    estimateMax: Math.max(0, Math.round(num(r.estimateMax, fb.estimateMax))),
    currency: "KRW",
    requiredDocuments: arr(r.requiredDocuments, fb.requiredDocuments).slice(0, 6),
    procedure: procedure.length === 3 ? procedure : fb.procedure,
    summary: str(r.summary, fb.summary).slice(0, 600)
  };
}

async function callHaiku(answers: Answers): Promise<ScreenResult | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  const userMsg = `카테고리: ${answers.category ?? "미기입"}
발생 시점: ${answers.timing ?? "미기입"}
문서 유무: ${answers.documents ?? "미기입"}
목표 시점: ${answers.goal ?? "미기입"}
예산 규모: ${answers.budget ?? "미기입"}`;
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }]
      })
    });
    if (!res.ok) {
      logger.warn("[ai-intake-screen] anthropic error", res.status);
      return null;
    }
    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    const text = data?.content?.[0]?.text?.trim();
    if (!text) return null;
    // 코드펜스 방지
    const cleaned = text.replace(/^```(?:json)?\n?|\n?```$/g, "").trim();
    try {
      return coerceResult(JSON.parse(cleaned), answers);
    } catch {
      // Sometimes model returns leading noise — try to extract braces
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return coerceResult(JSON.parse(m[0]), answers);
        } catch {
          return null;
        }
      }
      return null;
    }
  } catch (err) {
    logger.warn("[ai-intake-screen] exception", err);
    return null;
  }
}

export async function POST(request: Request) {
  const ip = getClientIpFromHeaders(request.headers) ?? "unknown";
  const rl = consumeRateLimit({
    namespace: "public:ai-intake-screen",
    key: ip,
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
  const answers = parseAnswers(payload);
  if (!answers || !answers.category) {
    return NextResponse.json(
      { ok: false, error: "5개 항목을 모두 선택해 주세요." },
      { status: 400 }
    );
  }
  const aiResult = await callHaiku(answers);
  const result = aiResult ?? fallbackResult(answers);
  return NextResponse.json({ ok: true, result, source: aiResult ? "ai" : "fallback" });
}
