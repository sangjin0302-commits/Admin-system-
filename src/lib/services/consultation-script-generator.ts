/**
 * AI 상담 스크립트 자동 생성
 *
 * 문의(Inquiry) 또는 사건(CaseMatter) 요약을 근거로 상담 대본을 생성한다.
 * 톤: 전문적이면서 따뜻하게 (professional, warm).
 * 섹션: 인사, 상황파악 질문 5개, 견적 안내, 다음 단계, 마무리.
 *
 * Claude Haiku 사용. ANTHROPIC_API_KEY 미설정 시 하드코딩된 템플릿 대본으로 폴백.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export interface ScriptSections {
  greeting: string;
  situationQuestions: string[];
  quoteBriefing: string;
  nextSteps: string;
  closing: string;
  provider: "claude-haiku" | "fallback";
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

function fallbackScript(contactName: string, title: string): ScriptSections {
  const name = contactName?.trim() || "고객님";
  return {
    greeting: `안녕하세요, ${name}. 접수하신 "${title}" 관련하여 상담 도와드릴 담당자입니다. 편안하게 말씀해 주세요.`,
    situationQuestions: [
      "이번 사안에서 가장 시급하게 해결이 필요한 부분은 어떤 것인가요?",
      "관련 서류(신분증, 계약서, 통지서 등)는 준비되어 있으신가요?",
      "관련 기관과 이미 접촉하신 이력이 있으실까요?",
      "희망하시는 처리 기한이 있으신가요?",
      "다른 곳에 같은 사안으로 문의하신 적이 있으신가요?"
    ],
    quoteBriefing:
      "말씀해 주신 내용을 기반으로 대략적인 견적 범위를 안내드리겠습니다. 실제 비용은 사안 확인 후 확정 견적서로 다시 안내드립니다.",
    nextSteps:
      "다음 단계로는 (1) 필요 서류 목록 안내, (2) 확정 견적서 전달, (3) 착수 계약 및 위임 절차로 진행됩니다.",
    closing:
      "오늘 상담 도와드려 감사드립니다. 추가 궁금하신 점은 언제든 메시지 남겨주시면 신속히 답변드리겠습니다.",
    provider: "fallback"
  };
}

function buildPrompt(input: {
  contactName: string;
  title: string;
  description: string;
  inquiryType: string;
  urgencyLevel: string;
  generatedSummary?: string | null;
}): string {
  return `당신은 한국 행정사무소의 상담 대본 작성 전문가입니다. 아래 문의 정보를 참고하여 상담 대본을 JSON으로 작성하세요.

문의 정보:
- 고객명: ${input.contactName}
- 제목: ${input.title}
- 유형: ${input.inquiryType}
- 긴급도: ${input.urgencyLevel}
- 요약: ${input.generatedSummary ?? "(없음)"}
- 내용: ${input.description}

톤: 전문적이면서 따뜻함(professional & warm). 존댓말. 과장·확답 금지.

응답 형식(엄격한 JSON만):
{
  "greeting": "인사말 1-2문장",
  "situationQuestions": ["상황 파악 질문 5개 배열"],
  "quoteBriefing": "견적 안내 2-3문장",
  "nextSteps": "다음 단계 안내 2-3문장",
  "closing": "마무리 인사 1-2문장"
}`;
}

async function generateWithClaude(
  apiKey: string,
  input: Parameters<typeof buildPrompt>[0]
): Promise<ScriptSections> {
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
      messages: [{ role: "user", content: buildPrompt(input) }]
    })
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`);
  }

  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON in AI response");
  }

  const parsed = JSON.parse(match[0]) as Partial<ScriptSections>;
  const questions = Array.isArray(parsed.situationQuestions)
    ? parsed.situationQuestions.filter((q): q is string => typeof q === "string" && q.trim().length > 0).slice(0, 6)
    : [];

  return {
    greeting: typeof parsed.greeting === "string" ? parsed.greeting.trim() : "",
    situationQuestions: questions.length > 0 ? questions : fallbackScript(input.contactName, input.title).situationQuestions,
    quoteBriefing: typeof parsed.quoteBriefing === "string" ? parsed.quoteBriefing.trim() : "",
    nextSteps: typeof parsed.nextSteps === "string" ? parsed.nextSteps.trim() : "",
    closing: typeof parsed.closing === "string" ? parsed.closing.trim() : "",
    provider: "claude-haiku"
  };
}

export async function generateConsultationScript(inquiryId: string): Promise<ScriptSections> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      contactName: true,
      title: true,
      description: true,
      inquiryType: true,
      urgencyLevel: true,
      generatedSummary: true
    }
  });

  if (!inquiry) {
    throw new Error(`Inquiry not found: ${inquiryId}`);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    logger.info("[consultation-script] ANTHROPIC_API_KEY unset — using fallback template");
    return fallbackScript(inquiry.contactName, inquiry.title);
  }

  try {
    return await generateWithClaude(apiKey, {
      contactName: inquiry.contactName,
      title: inquiry.title,
      description: inquiry.description,
      inquiryType: String(inquiry.inquiryType),
      urgencyLevel: String(inquiry.urgencyLevel),
      generatedSummary: inquiry.generatedSummary
    });
  } catch (err) {
    logger.warn("[consultation-script] AI generation failed, using fallback", err);
    return fallbackScript(inquiry.contactName, inquiry.title);
  }
}
