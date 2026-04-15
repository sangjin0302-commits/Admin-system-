import type { ClassificationResult } from "@/lib/classification/types";
import { getInquiryClassifier } from "@/lib/classification";
import {
  commonRecommendedDocuments,
  inquiryTypeDocuments
} from "@/lib/message-templates/catalog";
import { toLocale, type UrgencyLevel } from "@/types/inquiry";

import type {
  IntakeEvaluationInput,
  IntakeEvaluationResult,
  IntakeEvaluator
} from "./types";

function urgencyRank(level: UrgencyLevel) {
  return {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  }[level];
}

function maxUrgency(left: UrgencyLevel, right?: UrgencyLevel) {
  if (!right) return left;
  return urgencyRank(right) > urgencyRank(left) ? right : left;
}

export function deriveIntakeEvaluation(
  input: IntakeEvaluationInput,
  classified: ClassificationResult
): IntakeEvaluationResult {
  const inquiryType =
    input.requestedInquiryType && input.requestedInquiryType !== "UNKNOWN"
      ? classified.confidence < 0.7 || classified.inquiryType === "UNKNOWN"
        ? input.requestedInquiryType
        : classified.inquiryType
      : classified.inquiryType;

  const urgencyLevel = maxUrgency(classified.urgencyLevel, input.declaredUrgency);

  const requiresConsultationSignals = [
    input.isCorporateRequest || input.clientType === "COMPANY",
    !input.hasPreparedDocuments,
    input.needsTranslation,
    urgencyLevel === "HIGH" || urgencyLevel === "CRITICAL",
    inquiryType === "FOREIGNER_VISA" || inquiryType === "IMMIGRATION_STAY",
    input.description.length < 100
  ];
  const consultationRequired = requiresConsultationSignals.filter(Boolean).length >= 2;

  const locale = toLocale(input.preferredLanguage);
  const recommendedDocuments = [
    ...commonRecommendedDocuments[locale],
    ...inquiryTypeDocuments[inquiryType][locale]
  ];

  if (input.needsTranslation) {
    recommendedDocuments.push(
      locale === "ko"
        ? "번역 대상 원문 파일과 희망 언어 방향"
        : locale === "en"
          ? "Source files and target translation direction"
          : "[Arabic placeholder] Source files and translation direction"
    );
  }

  if (!input.hasPreparedDocuments) {
    recommendedDocuments.push(
      locale === "ko"
        ? "현재 보유한 서류 목록(없으면 없다고 표시)"
        : locale === "en"
          ? "Current document inventory (or indicate none)"
          : "[Arabic placeholder] Current document inventory"
    );
  }

  const uniqueRecommendedDocuments = Array.from(new Set(recommendedDocuments)).slice(0, 10);

  const hints: string[] = [];
  if (urgencyLevel === "CRITICAL") hints.push("만료/마감 임박 고위험 건");
  if (!input.hasPreparedDocuments) hints.push("접수 서류 미확보로 초기 상담 필요");
  if (input.needsTranslation) hints.push("번역 범위 확인 필요");
  if (input.isCorporateRequest || input.clientType === "COMPANY") {
    hints.push("기업 의뢰: 회사결정 주체 및 범위 확인 필요");
  }
  if (input.requestedInquiryType && input.requestedInquiryType !== classified.inquiryType) {
    hints.push("고객 선택 유형과 자동 분류 결과 불일치");
  }

  const recommendedNextStep = consultationRequired
    ? "1차 서류 체크리스트를 회신받은 뒤 상담 필요 여부와 견적 범위를 확정합니다."
    : "기본 서류 확인 후 견적 초안을 생성하고 관리자 검토를 진행합니다.";

  return {
    inquiryType,
    urgencyLevel,
    confidence: Math.max(classified.confidence, 0.6),
    qualificationScore: classified.qualificationScore,
    consultationRequired,
    status: consultationRequired ? "CONSULTATION_REQUIRED" : "PRE_DIAGNOSED",
    serviceTags: Array.from(
      new Set(
        [
          ...classified.serviceTags,
          input.needsTranslation ? "translation-needed" : "",
          input.isCorporateRequest || input.clientType === "COMPANY" ? "corporate" : "",
          input.hasPreparedDocuments ? "docs-ready" : "docs-missing"
        ].filter(Boolean)
      )
    ),
    classificationReason: classified.classificationReason,
    recommendedNextStep,
    recommendedDocuments: uniqueRecommendedDocuments,
    riskComplexityHint: hints.join(" / ") || "일반 케이스"
  };
}

export class RuleBasedIntakeEvaluator implements IntakeEvaluator {
  evaluate(input: IntakeEvaluationInput): IntakeEvaluationResult {
    const classifier = getInquiryClassifier();
    const desiredOutcome = input.requestedOutcome?.trim();
    const mergedDescription = desiredOutcome
      ? `${input.description}\n\nDesired outcome: ${desiredOutcome}`
      : input.description;

    const classified = classifier.classify({
      clientType: input.clientType,
      contactName: input.contactName,
      email: input.email,
      organizationName: input.organizationName,
      title: input.title,
      description: mergedDescription,
      nationality: input.nationality,
      currentStatus: input.currentStatus,
      documentCountry: input.documentCountry,
      targetAgency: input.targetAgency,
      dueDate: input.dueDate,
      preferredLanguage: input.preferredLanguage
    });

    return deriveIntakeEvaluation(input, classified);
  }
}
