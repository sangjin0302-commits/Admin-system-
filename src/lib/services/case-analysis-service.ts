import type { InquiryRecord } from "@/lib/services/inquiry-service";
import { inquiryTypeLabels, type InquiryType } from "@/types/inquiry";

type LawReference = {
  title: string;
  summary: string;
  keywords: string[];
};

type PrecedentReference = {
  query: string;
  summary: string;
  keywords: string[];
};

type AnalysisProfile = {
  laws: LawReference[];
  precedents: PrecedentReference[];
  issues: string[];
  favorableFactors: string[];
  riskFactors: string[];
  missingFacts: string[];
};

export type InquiryCaseAnalysis = {
  strengthScore: number;
  strengthLabel: "강함" | "보통" | "주의" | "불리";
  resolutionProbabilityPercent: number;
  resolutionOutlook: "높음" | "중간" | "신중" | "낮음";
  confidenceNote: string;
  summary: string;
  issues: string[];
  favorableFactors: string[];
  riskFactors: string[];
  missingFacts: string[];
  immediateActions: string[];
  communicationGuidance: {
    internalBrief: string;
    clientSummary: string;
    documentRequest: string;
  };
  lawReferences: LawReference[];
  precedentReferences: PrecedentReference[];
  recommendedAction: string;
};

const PROFILE_MAP: Record<InquiryType, AnalysisProfile> = {
  FOREIGNER_VISA: {
    laws: [
      {
        title: "출입국관리법",
        summary: "체류자격 변경, 사증, 체류기간, 강제퇴거 사유를 먼저 검토해야 합니다.",
        keywords: ["비자", "체류자격", "사증", "변경허가"]
      },
      {
        title: "출입국관리법 시행령",
        summary: "허가 요건, 제출 서류, 심사 기준을 구체적으로 확인해야 합니다.",
        keywords: ["시행령", "허가 요건", "제출 서류"]
      }
    ],
    precedents: [
      {
        query: "출입국관리법 체류자격 변경",
        summary: "체류자격 변경 불허, 출국명령과 연결된 판례를 먼저 확인합니다.",
        keywords: ["체류자격 변경", "출국명령", "재량"]
      },
      {
        query: "비자 불허 처분 취소",
        summary: "불허 처분의 사유 제시와 재량 일탈 여부를 검토합니다.",
        keywords: ["비자 불허", "처분 취소", "재량"]
      }
    ],
    issues: ["현재 체류자격과 목표 체류자격의 연결성", "스폰서 또는 고용처 자료의 충실도"],
    favorableFactors: ["현재 신분과 목적이 명확할수록 유리합니다.", "기한 여유가 있으면 설명과 보완이 쉬워집니다."],
    riskFactors: ["기존 체류 위반 이력이 있으면 심사 난도가 높아집니다.", "스폰서 자료가 약하면 허가 가능성이 낮아집니다."],
    missingFacts: ["현재 체류자격과 만료일", "변경하려는 비자 종류", "고용·초청·가족관계 자료 보유 여부"]
  },
  IMMIGRATION_STAY: {
    laws: [
      {
        title: "출입국관리법",
        summary: "체류 연장, 신고, 등록 의무, 강제퇴거 사유를 중심으로 검토합니다.",
        keywords: ["체류", "연장", "신고", "등록"]
      },
      {
        title: "재한외국인 처우 기본법",
        summary: "외국인 처우와 지원 체계가 쟁점인 경우 보조 근거가 됩니다.",
        keywords: ["외국인", "체류지원", "행정지원"]
      }
    ],
    precedents: [
      {
        query: "출입국관리법 강제퇴거",
        summary: "강제퇴거와 출국명령, 체류 위반 관련 판례를 확인합니다.",
        keywords: ["강제퇴거", "출국명령", "체류위반"]
      },
      {
        query: "외국인등록 처분 취소",
        summary: "등록, 신고, 자격 변경 누락과 연결된 사건을 찾아봅니다.",
        keywords: ["외국인등록", "신고", "처분 취소"]
      }
    ],
    issues: ["체류 의무 위반 여부", "신고·등록 누락 여부"],
    favorableFactors: ["기한 내 신고나 자진 시정이 있으면 설명 여지가 커집니다.", "사유가 구체적이면 재량 판단에 도움이 됩니다."],
    riskFactors: ["불법체류, 무단이동, 신고 누락은 불리합니다.", "사실관계가 불분명하면 전체 설명력이 약해집니다."],
    missingFacts: ["현재 체류지위와 만료일", "최근 출입국·신고 내역", "위반 통지나 보완 요구 여부"]
  },
  APOSTILLE_CONSULAR: {
    laws: [
      {
        title: "민원 처리에 관한 법률",
        summary: "공문서 발급과 민원 처리 흐름의 기본 근거로 검토합니다.",
        keywords: ["민원", "공문서", "발급"]
      },
      {
        title: "행정절차법",
        summary: "보완 요구나 처리 절차가 문제일 때 함께 살펴봅니다.",
        keywords: ["행정절차", "보완", "처리 절차"]
      }
    ],
    precedents: [
      {
        query: "영사확인 거부 처분",
        summary: "거부 사유와 절차 위반이 문제된 사례를 확인합니다.",
        keywords: ["영사확인", "거부", "처분"]
      },
      {
        query: "아포스티유 발급 거부",
        summary: "공문서 자격과 발급 권한이 쟁점인 사례를 검토합니다.",
        keywords: ["아포스티유", "발급", "거부"]
      }
    ],
    issues: ["대상 문서가 원본 공문서인지 여부", "사용 국가와 제출 기관 요구사항"],
    favorableFactors: ["제출 국가와 사용 목적이 명확하면 절차 설계가 쉬워집니다."],
    riskFactors: ["문서 성격이나 발급 권한이 불명확하면 진행이 지연될 수 있습니다."],
    missingFacts: ["문서 종류", "사용 국가", "제출 기관", "원본·사본 여부"]
  },
  TRANSLATION_NOTARY: {
    laws: [
      {
        title: "행정절차법",
        summary: "제출 기관 요구사항과 보완 요청 절차를 함께 검토합니다.",
        keywords: ["행정절차", "번역", "공증", "보완"]
      }
    ],
    precedents: [
      {
        query: "공증 서류 보완 요구",
        summary: "서류 형식 미비나 번역문 불일치가 쟁점이 된 사례를 확인합니다.",
        keywords: ["공증", "보완", "번역문"]
      }
    ],
    issues: ["제출 기관이 요구하는 번역·공증 범위", "원문과 번역문의 일치 여부"],
    favorableFactors: ["기관 요구 형식이 명확하면 진행이 안정적입니다."],
    riskFactors: ["원문 상태가 불명확하면 번역 이후 재작업 가능성이 있습니다."],
    missingFacts: ["원문 언어", "페이지 수", "제출 기관 요구사항", "초안 보유 여부"]
  },
  GENERAL_ADMIN_CIVIL: {
    laws: [
      {
        title: "행정절차법",
        summary: "처분 사유 제시, 청문, 의견제출, 절차 위반 여부를 먼저 봅니다.",
        keywords: ["처분", "청문", "의견제출", "절차"]
      },
      {
        title: "행정심판법",
        summary: "행정심판 대상성, 제기 기간, 집행정지 가능성을 함께 검토합니다.",
        keywords: ["행정심판", "제기기간", "집행정지"]
      },
      {
        title: "민원 처리에 관한 법률",
        summary: "민원 거부나 지연 처리 문제가 있으면 보조 근거가 됩니다.",
        keywords: ["민원", "거부", "지연 처리"]
      }
    ],
    precedents: [
      {
        query: "행정심판 처분 취소",
        summary: "절차 위반과 재량 일탈이 문제된 사건을 먼저 확인합니다.",
        keywords: ["행정심판", "처분 취소", "재량"]
      },
      {
        query: "행정절차법 처분서 작성 교부",
        summary: "처분서 기재와 통지 방식이 위법인지 검토합니다.",
        keywords: ["행정절차법", "처분서", "교부"]
      }
    ],
    issues: ["처분의 법적 근거와 절차 적법성", "행정심판 또는 소송으로 이어질지 여부"],
    favorableFactors: ["처분서 사유 제시가 부실하면 다툴 여지가 있습니다.", "기한 내 불복이면 초기 대응이 더 유리합니다."],
    riskFactors: ["제기기간이 지났으면 대응 폭이 줄어듭니다.", "사실관계가 약하면 절차 위반만으로는 부족할 수 있습니다."],
    missingFacts: ["처분일자", "통지 방식", "처분서 보유 여부", "기한 경과 여부"]
  },
  CORPORATE_REQUEST: {
    laws: [
      {
        title: "출입국관리법",
        summary: "외국인 채용, 초청, 체류자격과 연결되면 우선 검토합니다.",
        keywords: ["기업", "외국인 채용", "초청", "체류자격"]
      },
      {
        title: "행정절차법",
        summary: "허가·인가·행정처분 성격이면 절차 적법성을 함께 검토합니다.",
        keywords: ["허가", "인가", "행정절차"]
      }
    ],
    precedents: [
      {
        query: "기업 외국인 고용 출입국관리법",
        summary: "기업 고객의 외국인 채용과 체류 관련 사건을 우선 살펴봅니다.",
        keywords: ["기업", "외국인 고용", "출입국관리법"]
      }
    ],
    issues: ["회사 측 제출 서류 준비 수준", "개인 사건과 기업 사건의 책임 범위 분리"],
    favorableFactors: ["법인 자료와 담당자 창구가 명확하면 진행 속도가 빠릅니다."],
    riskFactors: ["기업 자료 누락이 있으면 전체 일정이 흔들릴 수 있습니다."],
    missingFacts: ["법인 기본서류 보유 여부", "담당자 연락 체계", "대상 인원 수", "기관 제출 마감일"]
  },
  UNKNOWN: {
    laws: [
      {
        title: "행정절차법",
        summary: "처분 또는 민원 처리와 연결될 가능성이 높아 기본 검토 법령으로 둡니다.",
        keywords: ["행정절차", "민원", "처분"]
      }
    ],
    precedents: [
      {
        query: "행정처분 취소",
        summary: "사건 유형이 불명확할 때 일반적인 처분 취소 사례부터 검토합니다.",
        keywords: ["행정처분", "취소"]
      }
    ],
    issues: ["사건 유형 자체를 먼저 구체화해야 합니다."],
    favorableFactors: ["목표 결과가 명확하면 분석 정확도가 올라갑니다."],
    riskFactors: ["사실관계가 부족하면 잘못된 안내를 할 가능성이 있습니다."],
    missingFacts: ["관할 기관", "처분 또는 민원 단계", "목표 결과", "기초 서류"]
  }
};

function normalizeText(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function buildDynamicSignals(inquiry: NonNullable<InquiryRecord>) {
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

function calculateStrengthScore(inquiry: NonNullable<InquiryRecord>, profile: AnalysisProfile) {
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

function labelFromScore(score: number): InquiryCaseAnalysis["strengthLabel"] {
  if (score >= 75) return "강함";
  if (score >= 58) return "보통";
  if (score >= 42) return "주의";
  return "불리";
}

function probabilityFromScore(score: number) {
  const resolutionProbabilityPercent = Math.max(24, Math.min(86, score));
  const resolutionOutlook: InquiryCaseAnalysis["resolutionOutlook"] =
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

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

export function analyzeInquiryCase(inquiry: NonNullable<InquiryRecord>): InquiryCaseAnalysis {
  const profile = PROFILE_MAP[inquiry.inquiryType];
  const dynamicSignals = buildDynamicSignals(inquiry);
  const strengthScore = calculateStrengthScore(inquiry, profile);
  const strengthLabel = labelFromScore(strengthScore);
  const typeLabel = inquiryTypeLabels[inquiry.inquiryType].ko;

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
      `${inquiry.contactName}님 사건은 현재 자료 기준으로 ${resolutionOutlook === "높음" ? "진행 여지가 비교적 큰 편" : resolutionOutlook === "중간" ? "추가 확인 후 진행 판단이 가능한 상태" : resolutionOutlook === "신중" ? "보완 확인이 먼저 필요한 상태" : "보수적 검토가 필요한 상태"}입니다.`,
      recommendedAction,
      confidenceNote
    ].join(" "),
    documentRequest: [
      `${inquiry.contactName}님, 빠른 판단을 위해 아래 자료를 먼저 확인 부탁드립니다.`,
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
