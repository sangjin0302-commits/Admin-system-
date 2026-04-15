import {
  inquiryTypeLabels,
  type InquiryType,
  type Locale,
  type UrgencyLevel
} from "@/types/inquiry";

import type { ClassificationInput, ClassificationResult, InquiryClassifier } from "./types";

type Rule = {
  type: InquiryType;
  tags: string[];
  keywords: string[];
};

const RULES: Rule[] = [
  {
    type: "CORPORATE_REQUEST",
    tags: ["corporate", "b2b"],
    keywords: [
      "법인",
      "기업",
      "company",
      "corporate",
      "hr",
      "relocation",
      "expat",
      "global mobility",
      "해외인력",
      "주재원"
    ]
  },
  {
    type: "FOREIGNER_VISA",
    tags: ["visa"],
    keywords: [
      "visa",
      "비자",
      "사증",
      "e-7",
      "d-8",
      "d-10",
      "f-6",
      "f-2",
      "초청",
      "취업비자",
      "change of status"
    ]
  },
  {
    type: "IMMIGRATION_STAY",
    tags: ["immigration", "stay"],
    keywords: [
      "출입국",
      "체류",
      "외국인등록",
      "residence",
      "stay extension",
      "연장",
      "변경신고",
      "overstay",
      "재입국",
      "등록증"
    ]
  },
  {
    type: "APOSTILLE_CONSULAR",
    tags: ["appeal", "administrative-appeal"],
    keywords: [
      "행정심판",
      "심판청구",
      "불복",
      "취소심판",
      "무효확인",
      "집행정지",
      "처분취소",
      "administrative appeal",
      "appeal petition"
    ]
  },
  {
    type: "GENERAL_ADMIN_CIVIL",
    tags: ["license", "permit"],
    keywords: [
      "인허가",
      "허가",
      "인가",
      "등록",
      "신고",
      "permit",
      "license",
      "approval",
      "business registration"
    ]
  },
  {
    type: "TRANSLATION_NOTARY",
    tags: ["other-admin"],
    keywords: [
      "민원",
      "행정",
      "확인서",
      "사실증명",
      "진정",
      "기타 상담",
      "administrative",
      "civil petition"
    ]
  }
];

const CRITICAL_KEYWORDS = [
  "today",
  "tomorrow",
  "urgent",
  "immediately",
  "긴급",
  "급합니다",
  "오늘",
  "내일",
  "이번주",
  "만료",
  "expiration",
  "출국"
];

function normalizeText(input: ClassificationInput) {
  return [
    input.organizationName,
    input.title,
    input.description,
    input.nationality,
    input.currentStatus,
    input.documentCountry,
    input.targetAgency
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function localeFromLanguageCode(languageCode: ClassificationInput["preferredLanguage"]): Locale {
  if (languageCode === "KO") return "ko";
  if (languageCode === "EN") return "en";
  return "ar";
}

function scoreRules(text: string, input: ClassificationInput) {
  return RULES.map((rule) => {
    let score = 0;
    const matched = rule.keywords.filter((keyword) => text.includes(keyword.toLowerCase()));

    score += matched.length * 2;

    if (rule.type === "CORPORATE_REQUEST" && input.clientType === "COMPANY") score += 4;
    if (rule.type === "CORPORATE_REQUEST" && input.organizationName) score += 2;
    if (rule.type === "FOREIGNER_VISA" && input.currentStatus?.toLowerCase().includes("visa")) {
      score += 2;
    }
    if (rule.type === "IMMIGRATION_STAY" && input.currentStatus?.toLowerCase().includes("stay")) {
      score += 2;
    }
    if (rule.type === "GENERAL_ADMIN_CIVIL" && input.targetAgency) score += 1;

    return { rule, matched, score };
  }).sort((a, b) => b.score - a.score);
}

function calculateUrgency(text: string, dueDate?: Date): UrgencyLevel {
  const now = new Date();
  const hasCriticalKeyword = CRITICAL_KEYWORDS.some((keyword) =>
    text.includes(keyword.toLowerCase())
  );

  if (!dueDate) return hasCriticalKeyword ? "HIGH" : "MEDIUM";

  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue <= 3 || hasCriticalKeyword) return "CRITICAL";
  if (daysUntilDue <= 7) return "HIGH";
  if (daysUntilDue <= 21) return "MEDIUM";
  return "LOW";
}

function calculateQualificationScore(
  input: ClassificationInput,
  inquiryType: InquiryType,
  matchedKeywords: string[]
) {
  let score = 0;

  if (input.email) score += 25;
  if (input.contactName) score += 10;
  if (input.organizationName) score += 10;
  if (input.dueDate) score += 10;
  if (input.description.length >= 120) score += 15;
  else if (input.description.length >= 60) score += 10;
  if (matchedKeywords.length >= 3) score += 15;
  else if (matchedKeywords.length > 0) score += 10;
  if (inquiryType !== "UNKNOWN") score += 10;
  if (input.clientType === "COMPANY") score += 5;

  return Math.min(score, 100);
}

export class RuleBasedInquiryClassifier implements InquiryClassifier {
  classify(input: ClassificationInput): ClassificationResult {
    const text = normalizeText(input);
    const [topRule] = scoreRules(text, input);
    const inquiryType = topRule && topRule.score > 0 ? topRule.rule.type : "UNKNOWN";
    const matchedKeywords = topRule?.matched ?? [];
    const urgencyLevel = calculateUrgency(text, input.dueDate);
    const qualificationScore = calculateQualificationScore(input, inquiryType, matchedKeywords);
    const locale = localeFromLanguageCode(input.preferredLanguage);
    const typeLabel = inquiryTypeLabels[inquiryType][locale];
    const confidence = topRule?.score ? Math.min(0.55 + topRule.score * 0.07, 0.96) : 0.42;

    const tags = [...new Set([...(topRule?.rule.tags ?? []), ...matchedKeywords.slice(0, 4)])];
    const classificationReason =
      matchedKeywords.length > 0
        ? `Detected ${typeLabel} based on keywords: ${matchedKeywords.join(", ")}`
        : "No strong keyword match was found, so the case was marked for manual review.";

    const recommendedNextStep =
      inquiryType === "CORPORATE_REQUEST"
        ? "Check company documents, scope, and timeline before sending a bundled quotation."
        : inquiryType === "APOSTILLE_CONSULAR"
          ? "Review the administrative decision, filing period, and remedy goal before consultation."
          : inquiryType === "GENERAL_ADMIN_CIVIL"
            ? "Confirm the target authority, filing type, and required documents before consultation."
            : inquiryType === "IMMIGRATION_STAY"
              ? "Check current stay status, deadline, and reporting obligations before consultation."
              : inquiryType === "FOREIGNER_VISA"
                ? "Confirm current visa, target visa, and sponsor documents before consultation."
                : inquiryType === "TRANSLATION_NOTARY"
                  ? "Review the issue first and confirm whether it falls within direct handling or needs separate guidance."
                  : "Review the inquiry manually and clarify the target authority and deadline.";

    return {
      inquiryType,
      urgencyLevel,
      confidence,
      qualificationScore,
      serviceTags: tags,
      classificationReason,
      recommendedNextStep
    };
  }
}
