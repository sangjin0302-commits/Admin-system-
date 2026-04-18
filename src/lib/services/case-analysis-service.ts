import type { InquiryRecord } from "@/lib/services/inquiry-service";
import {
  inquiryTypeLabels,
  normalizeInquiryType
} from "@/types/inquiry";
import { PROFILE_MAP } from "@/lib/services/case-analysis-profiles";
import type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-types";
import {
  buildDynamicSignals,
  calculateStrengthScore,
  labelFromScore,
  probabilityFromScore,
  unique
} from "@/lib/services/case-analysis-scoring-helpers";

export type { InquiryCaseAnalysis } from "@/lib/services/case-analysis-types";

export function analyzeInquiryCase(inquiry: NonNullable<InquiryRecord>): InquiryCaseAnalysis {
  const inquiryType = normalizeInquiryType(inquiry.inquiryType);
  const profile = PROFILE_MAP[inquiryType] ?? PROFILE_MAP.UNKNOWN;
  const dynamicSignals = buildDynamicSignals(inquiry);
  const strengthScore = calculateStrengthScore(inquiry, profile);
  const strengthLabel = labelFromScore(strengthScore);
  const typeLabel = inquiryTypeLabels[inquiryType]?.ko ?? inquiryTypeLabels.UNKNOWN.ko;
  const displayName = inquiry.contactName?.trim() || "고객";

  const favorableFactors = unique([...profile.favorableFactors, ...dynamicSignals.favorable]);
  const riskFactors = unique([...profile.riskFactors, ...dynamicSignals.risk]);
  const missingFacts = unique([...profile.missingFacts, ...dynamicSignals.missing]);
  const issues = unique([...profile.issues, ...dynamicSignals.issues]);
  const { resolutionProbabilityPercent, resolutionOutlook, confidenceNote } = probabilityFromScore(strengthScore);

  const recommendedAction =
    strengthLabel === "강함"
      ? "추가 서류를 먼저 확보한 뒤 견적 또는 사건 전환 단계로 바로 이어가는 것이 좋습니다."
      : strengthLabel === "보통"
        ? "추가 사실관계나 필수 서류를 보완한 뒤 상담 또는 사전진단을 진행하는 것이 안전합니다."
        : strengthLabel === "주의"
          ? "기한, 위반 이력, 처분서 보유 여부를 먼저 정리한 뒤 불복 또는 대안 전략을 함께 검토하는 것이 좋습니다."
          : "현재 자료만으로는 불리 요소가 커 보여 추가 사실 확인과 보수적인 안내가 먼저 필요합니다.";

  const immediateActions = unique([
    missingFacts[0] ? `${missingFacts[0]} 확인` : "",
    missingFacts[1] ? `${missingFacts[1]} 확인` : "",
    inquiry.hasPreparedDocuments ? "기존 보유 서류 진위와 최신성 확인" : "기본 서류 확보 요청",
    inquiry.dueDate ? "희망 일정 기준으로 제출 가능 시점 점검" : "정확한 제출 또는 마감 일정 확인",
    recommendedAction
  ]).slice(0, 5);

  const communicationGuidance = {
    internalBrief: [
      `${typeLabel} 사건으로 분류되며 현재 해결 가능성 평가는 ${resolutionOutlook}(${resolutionProbabilityPercent}점)입니다.`,
      `핵심 쟁점은 ${issues.slice(0, 2).join(", ") || "추가 사실관계 확인"}입니다.`,
      `우선 조치는 ${immediateActions[0] || recommendedAction}입니다.`
    ].join(" "),
    clientSummary: [
      `${displayName}님 사건은 현재 자료 기준으로 ${resolutionOutlook === "높음" ? "진행 여지가 비교적 큰 편" : resolutionOutlook === "중간" ? "추가 확인 후 진행 판단이 가능한 상태" : resolutionOutlook === "신중" ? "보완 확인이 먼저 필요한 상태" : "보수적 검토가 필요한 상태"}입니다.`,
      recommendedAction,
      confidenceNote
    ].join(" "),
    documentRequest: [
      `${displayName}님, 빠른 판단을 위해 아래 자료를 먼저 확인 부탁드립니다.`,
      ...missingFacts.slice(0, 4).map((item, index) => `${index + 1}. ${item}`),
      "자료를 보내주시면 검토 후 가능 범위와 다음 절차를 순차적으로 안내드리겠습니다."
    ].join("\n")
  };

  return {
    strengthScore,
    strengthLabel,
    resolutionProbabilityPercent,
    resolutionOutlook,
    confidenceNote,
    summary: `${typeLabel} 사건으로 분류되며, 현재 입력 정보 기준 사건 강도는 ${strengthLabel}(${strengthScore}점)입니다.`,
    issues,
    favorableFactors,
    riskFactors,
    missingFacts,
    immediateActions,
    communicationGuidance,
    lawReferences: profile.laws,
    precedentReferences: profile.precedents,
    recommendedAction
  };
}
