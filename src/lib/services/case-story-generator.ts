/**
 * AI 사례 스토리 카드 생성기.
 *
 * 종결(CLOSED) CaseMatter를 익명화하여 마케팅 안전한 스토리 카드 JSON 반환.
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

export type CaseStory = {
  title: string;              // 한 줄
  problem: string;            // 2줄
  solution: string;           // 2줄
  outcome: string;            // 1줄
  category: string;           // PracticeAreaKey
  keyLearnings: string[];     // 3 bullets
};

const MODEL = "claude-haiku-4-5-20251001";

/**
 * 이름/회사/사건번호 등 개인정보 제거.
 * 완벽하지 않지만 LLM 프롬프트로 넘기기 전 1차 필터.
 */
function stripPII(text: string): string {
  if (!text) return "";
  return text
    // 사건번호: 2023가단12345, 2024노567, 2023헌마1
    .replace(/\d{4}[가-힣]{1,3}\d{2,7}/g, "[사건번호]")
    // 주민등록번호
    .replace(/\d{6}[-\s]?\d{7}/g, "[주민번호]")
    // 여권번호 (알파벳 1~2 + 숫자 7~9)
    .replace(/\b[A-Z]{1,2}\d{7,9}\b/g, "[여권번호]")
    // 전화번호
    .replace(/\b0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}\b/g, "[전화]")
    // 이메일
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[이메일]")
    // 회사 접미
    .replace(/[가-힣A-Za-z0-9]+\s*(주식회사|㈜|\(주\)|주식|유한회사)/g, "[회사]")
    // 세 글자 한글 이름 뒤 조사/호칭
    .replace(/[가-힣]{2,4}(님|씨|대표|사장|이사|과장|팀장|의뢰인)/g, "[이름]$1")
    .replace(/\s+/g, " ")
    .trim();
}

const CATEGORY_MAP: Record<string, string> = {
  VISA_STAY: "VISA_STAY",
  ADMIN_APPEAL: "ADMIN_APPEAL",
  CONTRACT_INVESTIGATION: "CONTRACT_INVESTIGATION",
  LICENSE_PERMIT: "LICENSE_PERMIT",
  CORP_FORMATION: "CORP_FORMATION",
  IMMIGRATION: "VISA_STAY",
  ADMINISTRATIVE_APPEAL: "ADMIN_APPEAL",
  CONTRACT: "CONTRACT_INVESTIGATION",
  LICENSE: "LICENSE_PERMIT",
  CORPORATE: "CORP_FORMATION",
  OTHER: "VISA_STAY",
};

function normalizeCategory(raw: string): string {
  return CATEGORY_MAP[raw] ?? "VISA_STAY";
}

export async function generateCaseStory(caseMatterId: string): Promise<CaseStory> {
  const caseMatter = await prisma.caseMatter.findUnique({
    where: { id: caseMatterId },
    include: {
      events: {
        orderBy: { createdAt: "asc" },
        take: 30,
      },
    },
  });

  if (!caseMatter) throw new Error("CaseMatter not found");
  if (caseMatter.status !== "CLOSED") throw new Error("Case must be CLOSED to generate story");

  const cleanTitle = stripPII(caseMatter.title ?? "");
  const cleanSummary = stripPII(caseMatter.summary ?? "");
  const eventsText = caseMatter.events
    .map((e) => `- [${e.eventType}] ${stripPII(e.message ?? "")}`)
    .join("\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackStory(cleanTitle, cleanSummary, caseMatter.category);
  }

  const prompt = `당신은 행정사 사무소의 마케팅 담당자입니다. 종결된 사건을 익명·요약해서 홈페이지 "처리 사례" 카드로 만들려 합니다.

⚠️ 절대 금지: 실명, 회사명, 사건번호, 특정 개인정보, 특정 관공서 담당자명.
✅ 목표: 의뢰인이 공감할 수 있는 문제 → 접근 방식 → 결과 구조.

원본 (이미 1차 익명화됨):
- 분야: ${caseMatter.category}
- 제목: ${cleanTitle}
- 요약: ${cleanSummary}
- 주요 이벤트:
${eventsText || "(이벤트 없음)"}

다음 JSON만 반환 (다른 텍스트 금지):
{
  "title": "한 줄 카드 제목 (30자 이내, 익명·요약)",
  "problem": "의뢰인이 겪은 어려움 2줄 (\\n으로 구분)",
  "solution": "사무소의 접근 방식 2줄 (\\n으로 구분)",
  "outcome": "결과 1줄",
  "category": "${caseMatter.category}",
  "keyLearnings": ["학습 포인트 1", "학습 포인트 2", "학습 포인트 3"]
}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in AI response");
    const parsed = JSON.parse(match[0]) as CaseStory;

    return {
      title: String(parsed.title ?? "").slice(0, 60),
      problem: String(parsed.problem ?? ""),
      solution: String(parsed.solution ?? ""),
      outcome: String(parsed.outcome ?? ""),
      category: normalizeCategory(String(parsed.category ?? caseMatter.category)),
      keyLearnings: Array.isArray(parsed.keyLearnings)
        ? parsed.keyLearnings.slice(0, 3).map((s) => String(s))
        : [],
    };
  } catch (err) {
    logger.warn("[case-story-generator] AI failed, using fallback", err);
    return fallbackStory(cleanTitle, cleanSummary, caseMatter.category);
  }
}

function fallbackStory(title: string, summary: string, category: string): CaseStory {
  return {
    title: title || "종결 사건 요약",
    problem: (summary || "행정 절차상 어려움을 겪던 사안").slice(0, 120),
    solution: "필요 서류 정리 및 관련 법령 검토 후 절차 대응.",
    outcome: "정상 종결.",
    category: normalizeCategory(category),
    keyLearnings: [
      "충분한 사전 검토가 결과를 좌우합니다.",
      "관계 기관과의 커뮤니케이션이 중요합니다.",
      "기한 관리가 성패를 결정합니다.",
    ],
  };
}
