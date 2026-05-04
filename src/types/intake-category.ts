import type { ClientType, InquiryType } from "@/types/inquiry";

export const intakeCategoryValues = [
  "visa",
  "corporation",
  "administrative_appeal",
  "fact_finding_contract",
  "permit_license",
  "arabic_translation"
] as const;

export type IntakeCategory = (typeof intakeCategoryValues)[number];

export type IntakeCategoryDetailField = {
  key: string;
  label: string;
  input: "text" | "textarea" | "date" | "select";
  placeholder?: string;
  options?: readonly string[];
};

export const intakeCategoryLabels: Record<IntakeCategory, string> = {
  visa: "비자",
  corporation: "법인",
  administrative_appeal: "행정심판",
  fact_finding_contract: "사실조사 및 계약서 작성",
  permit_license: "인허가",
  arabic_translation: "기타 아랍어 번역"
};

export const intakeCategoryInquiryTypeMap: Record<IntakeCategory, InquiryType> = {
  visa: "FOREIGNER_VISA",
  corporation: "CORPORATE_REQUEST",
  administrative_appeal: "GENERAL_ADMIN_CIVIL",
  fact_finding_contract: "GENERAL_ADMIN_CIVIL",
  permit_license: "GENERAL_ADMIN_CIVIL",
  arabic_translation: "TRANSLATION_NOTARY"
};

export const intakeCategoryClientTypeMap: Record<IntakeCategory, ClientType> = {
  visa: "INDIVIDUAL",
  corporation: "COMPANY",
  administrative_appeal: "INDIVIDUAL",
  fact_finding_contract: "INDIVIDUAL",
  permit_license: "COMPANY",
  arabic_translation: "INDIVIDUAL"
};

export const consultationMethodOptions = [
  "전화 상담",
  "이메일 상담",
  "방문 상담",
  "화상 상담"
] as const;

export const preferredLanguageOptions = ["한국어", "영어", "아랍어"] as const;

export const urgencyOptionLabels = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  CRITICAL: "매우 긴급"
} as const;

export const documentAvailabilityOptions = [
  "관련 서류 보유",
  "일부 보유",
  "아직 없음",
  "확인 필요"
] as const;

export const intakeCategoryDetailFields: Record<IntakeCategory, readonly IntakeCategoryDetailField[]> = {
  visa: [
    { key: "nationality", label: "국적", input: "text" },
    { key: "currentVisaStatus", label: "현재 체류 자격", input: "text" },
    { key: "desiredVisaType", label: "희망 비자 종류", input: "text" },
    { key: "stayExpiryDate", label: "체류 만료일", input: "date" },
    { key: "insideKorea", label: "한국 내 체류 여부", input: "select", options: ["예", "아니오", "확인 필요"] },
    { key: "familyAccompanying", label: "가족 동반 여부", input: "select", options: ["예", "아니오", "미정"] },
    { key: "priorDenialOrExitOrder", label: "과거 불허/거절/출국명령 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "currentDocuments", label: "현재 보유 서류", input: "textarea" },
    { key: "urgentReason", label: "긴급 사유", input: "textarea" }
  ],
  corporation: [
    { key: "workType", label: "업무 유형", input: "text" },
    { key: "corporationType", label: "법인 형태", input: "text" },
    { key: "representativeNationality", label: "대표자 국적", input: "text" },
    { key: "shareholderOfficerStructure", label: "주주/임원 구성", input: "textarea" },
    { key: "businessPurpose", label: "사업 목적", input: "textarea" },
    { key: "capitalAmount", label: "자본금 규모", input: "text" },
    { key: "hasBusinessAddress", label: "사업장 주소 보유 여부", input: "select", options: ["예", "아니오", "예정"] },
    { key: "requiredPermit", label: "필요한 인허가 여부", input: "text" }
  ],
  administrative_appeal: [
    { key: "agency", label: "처분 기관", input: "text" },
    { key: "dispositionName", label: "처분명", input: "text" },
    { key: "noticeDate", label: "처분 통지일", input: "date" },
    { key: "hasDispositionNotice", label: "처분서 보유 여부", input: "select", options: ["예", "아니오", "확인 필요"] },
    { key: "knowsAppealDeadline", label: "불복 기한 인지 여부", input: "select", options: ["예", "아니오", "확인 필요"] },
    { key: "desiredResult", label: "원하는 결과", input: "textarea" },
    { key: "caseBackground", label: "사건 경위", input: "textarea" },
    { key: "priorObjection", label: "기존 이의신청/민원 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "hasEvidence", label: "증거자료 보유 여부", input: "select", options: ["예", "아니오", "일부 보유"] }
  ],
  fact_finding_contract: [
    { key: "workType", label: "업무 유형", input: "text" },
    { key: "counterpartyType", label: "상대방 유형", input: "text" },
    { key: "mainFacts", label: "주요 사실관계", input: "textarea" },
    { key: "keyDates", label: "주요 날짜", input: "text" },
    { key: "hasDispute", label: "분쟁 여부", input: "select", options: ["있음", "없음", "가능성 있음"] },
    { key: "documentType", label: "원하는 문서 종류", input: "text" },
    { key: "hasExistingMaterials", label: "기존 계약서/자료 보유 여부", input: "select", options: ["예", "아니오", "일부 보유"] },
    { key: "finalUsePurpose", label: "최종 사용 목적", input: "textarea" }
  ],
  permit_license: [
    { key: "permitType", label: "인허가 종류", input: "text" },
    { key: "targetAgency", label: "대상 기관", input: "text" },
    { key: "siteAddress", label: "사업장 또는 대상지 주소", input: "text" },
    { key: "currentStage", label: "현재 진행 단계", input: "text" },
    { key: "priorConsultationOrFiling", label: "기존 상담/접수 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "hasSupplementRequest", label: "보완 요구 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "desiredCompletionDate", label: "희망 완료 시점", input: "date" },
    { key: "hasPlansOrProof", label: "관련 도면/사업계획서/증빙 보유 여부", input: "select", options: ["예", "아니오", "일부 보유"] }
  ],
  arabic_translation: [
    { key: "translationDirection", label: "번역 방향", input: "select", options: ["아랍어→한국어", "한국어→아랍어", "영어 포함", "기타"] },
    { key: "documentType", label: "문서 종류", input: "text" },
    { key: "needsNotaryCertification", label: "공증/인증 필요 여부", input: "select", options: ["필요", "불필요", "확인 필요"] },
    { key: "needsApostilleOrConsular", label: "아포스티유/영사확인 필요 여부", input: "select", options: ["필요", "불필요", "확인 필요"] },
    { key: "submissionAgency", label: "제출 기관", input: "text" },
    { key: "volume", label: "분량", input: "text" },
    { key: "desiredDeadline", label: "희망 납기", input: "date" },
    { key: "hasOriginalFile", label: "원본 파일 보유 여부", input: "select", options: ["예", "아니오", "스캔본만 보유"] }
  ]
} as const;

export function getIntakeCategoryDetailLabel(category: IntakeCategory, key: string) {
  return intakeCategoryDetailFields[category].find((field) => field.key === key)?.label ?? key;
}
