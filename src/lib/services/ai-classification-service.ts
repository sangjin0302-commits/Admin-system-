import { logger } from "@/lib/utils/logger";
const INQUIRY_TYPE_MAP: Record<string, string> = {
  비자: "FOREIGNER_VISA",
  체류: "IMMIGRATION_STAY",
  visa: "FOREIGNER_VISA",
  immigration: "IMMIGRATION_STAY",
  아포스티유: "APOSTILLE_CONSULAR",
  apostille: "APOSTILLE_CONSULAR",
  영사: "APOSTILLE_CONSULAR",
  번역: "TRANSLATION_NOTARY",
  공증: "TRANSLATION_NOTARY",
  translation: "TRANSLATION_NOTARY",
  행정: "GENERAL_ADMIN_CIVIL",
  민원: "GENERAL_ADMIN_CIVIL",
  법인: "CORPORATE_REQUEST",
  회사: "CORPORATE_REQUEST",
  corporate: "CORPORATE_REQUEST",
};

const URGENCY_KEYWORDS: Record<string, string> = {
  긴급: "HIGH",
  urgent: "HIGH",
  급해: "HIGH",
  빨리: "HIGH",
  강제퇴거: "CRITICAL",
  출국: "CRITICAL",
  deportation: "CRITICAL",
  기한: "HIGH",
  deadline: "HIGH",
};

export type ClassificationResult = {
  inquiryType: string;
  urgencyLevel: string;
  confidence: number;
  reason: string;
};

export async function classifyInquiry(
  name: string,
  message: string,
  title?: string,
): Promise<ClassificationResult> {
  const text = `${title ?? ""} ${message}`.toLowerCase();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await classifyWithAI(apiKey, name, message, title);
    } catch (err) {
      logger.error("AI classification failed, falling back to keyword:", err);
    }
  }

  return classifyByKeyword(text);
}

function classifyByKeyword(text: string): ClassificationResult {
  let inquiryType = "UNKNOWN";
  let confidence = 0.3;

  for (const [keyword, type] of Object.entries(INQUIRY_TYPE_MAP)) {
    if (text.includes(keyword)) {
      inquiryType = type;
      confidence = 0.6;
      break;
    }
  }

  let urgencyLevel = "MEDIUM";
  for (const [keyword, level] of Object.entries(URGENCY_KEYWORDS)) {
    if (text.includes(keyword)) {
      urgencyLevel = level;
      break;
    }
  }

  return {
    inquiryType,
    urgencyLevel,
    confidence,
    reason: "키워드 기반 분류",
  };
}

async function classifyWithAI(
  apiKey: string,
  name: string,
  message: string,
  title?: string,
): Promise<ClassificationResult> {
  const prompt = `You are classifying an inquiry for an administrative agent (행정사) office.
Given the inquiry below, classify it into one of these types:
- FOREIGNER_VISA: 외국인 비자, 사증 관련
- IMMIGRATION_STAY: 체류자격, 체류연장 관련
- APOSTILLE_CONSULAR: 아포스티유, 영사 인증
- TRANSLATION_NOTARY: 번역, 공증
- GENERAL_ADMIN_CIVIL: 일반 행정/민원
- CORPORATE_REQUEST: 법인, 기업 관련
- UNKNOWN: 판단 불가

And urgency:
- LOW, MEDIUM, HIGH, CRITICAL

Respond ONLY with JSON: {"inquiryType":"...","urgencyLevel":"...","confidence":0.0-1.0,"reason":"한국어 설명"}

Inquiry from ${name}:
Title: ${title ?? "없음"}
Message: ${message}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");

  return JSON.parse(match[0]) as ClassificationResult;
}
