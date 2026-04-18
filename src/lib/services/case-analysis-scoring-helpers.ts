import type { InquiryRecord } from "@/lib/services/inquiry-service";
import type {
  AnalysisProfile,
  ResolutionOutlook,
  StrengthLabel
} from "@/lib/services/case-analysis-types";

type StrengthProfile = Pick<AnalysisProfile, "riskFactors" | "favorableFactors">;

export function normalizeText(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function buildDynamicSignals(inquiry: NonNullable<InquiryRecord>) {
  const text = normalizeText(
    inquiry.title,
    inquiry.description,
    inquiry.requestedOutcome,
    inquiry.currentStatus,
    inquiry.targetAgency
  );

  const favorable: string[] = [];
  const risk: string[] = [];
  const missing: string[] = [];
  const issues: string[] = [];

  if (inquiry.hasPreparedDocuments) {
    favorable.push("기본 서류를 이미 보유하고 있어 초기 검토 속도가 빠를 수 있습니다.");
  } else {
    risk.push("기본 서류가 아직 준비되지 않아 사실관계 확인이 늦어질 수 있습니다.");
    missing.push("여권, 외국인등록증, 처분서 등 기본 서류 보유 여부");
  }

  if (inquiry.needsTranslation) {
    issues.push("번역 또는 제출 언어 요구사항을 일정과 비용 추정에 반영해야 합니다.");
  }

  if (inquiry.dueDate) {
    const daysUntilDue = Math.ceil((inquiry.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 3) {
      risk.push("기한이 매우 촉박해 긴급 대응 또는 범위 조정이 필요합니다.");
    } else if (daysUntilDue <= 10) {
      issues.push("기한이 임박해 사실관계 정리와 서류 확보를 우선해야 합니다.");
    } else {
      favorable.push("기한까지 여유가 있어 서류와 설명을 더 정교하게 준비할 수 있습니다.");
    }
  } else {
    missing.push("정확한 마감일 또는 제출 일정");
  }

  if (text.includes("거부") || text.includes("불허") || text.includes("취소") || text.includes("출국명령")) {
    issues.push("이미 불리한 처분이 발생한 사건인지 확인하고, 불복 가능 기간을 먼저 봐야 합니다.");
  }

  if (text.includes("강제퇴거") || text.includes("불법체류") || text.includes("위반")) {
    risk.push("체류 위반이나 강제 조치와 연결되면 일반 허가 사건보다 방어 논리 준비가 더 중요합니다.");
  }

  if (!inquiry.requestedOutcome) {
    missing.push("고객이 원하는 최종 결과와 우선순위");
  }

  if (!inquiry.currentStatus) {
    missing.push("현재 체류 또는 처분 단계");
  }

  return { favorable, risk, missing, issues };
}

export function calculateStrengthScore(
  inquiry: NonNullable<InquiryRecord>,
  profile: StrengthProfile
) {
  let score = 52;

  score += Math.round(inquiry.classificationConfidence * 18);
  score += Math.round(inquiry.qualificationScore * 0.18);

  if (inquiry.hasPreparedDocuments) score += 8;
  if (inquiry.requestedOutcome) score += 5;
  if (inquiry.currentStatus) score += 4;
  if (inquiry.consultationRequired) score -= 4;
  if (inquiry.needsTranslation) score -= 3;

  if (inquiry.dueDate) {
    const daysUntilDue = Math.ceil((inquiry.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 3) score -= 14;
    else if (daysUntilDue <= 7) score -= 8;
    else if (daysUntilDue <= 21) score -= 3;
    else score += 2;
  }

  score -= Math.max(profile.riskFactors.length - profile.favorableFactors.length, 0) * 2;

  return Math.max(18, Math.min(score, 92));
}

export function labelFromScore(score: number): StrengthLabel {
  if (score >= 75) return "강함";
  if (score >= 58) return "보통";
  if (score >= 42) return "주의";
  return "불리";
}

export function probabilityFromScore(score: number): {
  resolutionProbabilityPercent: number;
  resolutionOutlook: ResolutionOutlook;
  confidenceNote: string;
} {
  const resolutionProbabilityPercent = Math.max(24, Math.min(86, score));
  const resolutionOutlook: ResolutionOutlook =
    resolutionProbabilityPercent >= 74
      ? "높음"
      : resolutionProbabilityPercent >= 58
        ? "중간"
        : resolutionProbabilityPercent >= 42
          ? "신중"
          : "낮음";

  const confidenceNote =
    resolutionOutlook === "높음"
      ? "현재 입력 정보만 놓고 보면 진행 여지가 비교적 큰 편입니다. 다만 기관 재량과 추가 자료에 따라 결과는 달라질 수 있습니다."
      : resolutionOutlook === "중간"
        ? "핵심 사실관계와 필수 자료가 더 확보되면 해결 가능성을 더 분명하게 판단할 수 있습니다."
        : resolutionOutlook === "신중"
          ? "현재 단계에서는 불리 요소와 누락 정보가 함께 보여 보수적으로 접근하는 편이 안전합니다."
          : "지금 자료만으로는 해결 가능성을 높게 보기 어렵습니다. 추가 사실 확인과 전략 재설계가 먼저 필요합니다.";

  return { resolutionProbabilityPercent, resolutionOutlook, confidenceNote };
}

export function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}
