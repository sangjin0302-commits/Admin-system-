import type { ClientType, InquiryType } from "@/types/inquiry";

export const intakeCategoryValues = [
  "visa",
  "corporation",
  "administrative_appeal",
  "fact_finding_contract",
  "permit_license",
  "arabic_translation",
  "civil_petition"
] as const;

export type IntakeCategory = (typeof intakeCategoryValues)[number];

export const civilPetitionSubtypeValues = [
  "자동차 등록",
  "일반 민원",
  "고충 민원",
  "정보 공개",
  "기타"
] as const;

export type CivilPetitionSubtype = (typeof civilPetitionSubtypeValues)[number];

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
  arabic_translation: "아랍어 통번역",
  civil_petition: "기타 민원"
};

export const intakeCategoryInquiryTypeMap: Record<IntakeCategory, InquiryType> = {
  visa: "FOREIGNER_VISA",
  corporation: "CORPORATE_REQUEST",
  administrative_appeal: "GENERAL_ADMIN_CIVIL",
  fact_finding_contract: "GENERAL_ADMIN_CIVIL",
  permit_license: "GENERAL_ADMIN_CIVIL",
  arabic_translation: "TRANSLATION_NOTARY",
  civil_petition: "GENERAL_ADMIN_CIVIL"
};

export const intakeCategoryClientTypeMap: Record<IntakeCategory, ClientType> = {
  visa: "INDIVIDUAL",
  corporation: "COMPANY",
  administrative_appeal: "INDIVIDUAL",
  fact_finding_contract: "INDIVIDUAL",
  permit_license: "COMPANY",
  arabic_translation: "INDIVIDUAL",
  civil_petition: "INDIVIDUAL"
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
    { key: "workType", label: "업무 유형", input: "select", options: ["신규", "연장", "변경", "초청", "불허 대응", "출국명령 대응", "기타"] },
    { key: "nationality", label: "국적", input: "text" },
    { key: "currentVisaStatus", label: "현재 체류 자격", input: "text" },
    { key: "desiredVisaType", label: "희망 체류 자격", input: "text" },
    { key: "stayExpiryDate", label: "체류 만료일", input: "date" },
    { key: "insideKorea", label: "한국 내 체류 여부", input: "select", options: ["예", "아니오", "확인 필요"] },
    { key: "familyAccompanying", label: "가족 동반 여부", input: "select", options: ["예", "아니오", "미정"] },
    { key: "priorDenialOrExitOrder", label: "과거 불허/거절/출국명령 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "currentDocuments", label: "현재 보유 서류", input: "textarea" },
    { key: "urgentReason", label: "긴급 사유", input: "textarea" }
  ],
  corporation: [
    { key: "workType", label: "업무 유형", input: "select", options: ["설립", "변경", "외국인투자", "지점·연락사무소", "폐업·청산", "기타"] },
    { key: "corporationType", label: "법인 형태", input: "text" },
    { key: "representativeNationality", label: "대표자 국적", input: "text" },
    { key: "shareholderOfficerStructure", label: "주주/임원 구성", input: "textarea" },
    { key: "businessPurpose", label: "사업 목적", input: "textarea" },
    { key: "capitalAmount", label: "자본금 규모", input: "text" },
    { key: "hasBusinessAddress", label: "사업장 주소 보유 여부", input: "select", options: ["예", "아니오", "예정"] },
    { key: "requiredPermit", label: "필요한 인허가 여부", input: "text" },
    { key: "foreignInvestorOrHq", label: "외국인 투자자 또는 해외 본사 여부", input: "select", options: ["있음", "없음", "확인 필요"] }
  ],
  administrative_appeal: [
    { key: "agency", label: "처분 기관", input: "text" },
    { key: "dispositionName", label: "처분명", input: "text" },
    { key: "noticeDate", label: "처분 통지일", input: "date" },
    { key: "hasDispositionNotice", label: "처분서 보유 여부", input: "select", options: ["예", "아니오", "확인 필요"] },
    { key: "knowsAppealDeadline", label: "불복 기한 인지 여부", input: "select", options: ["예", "아니오", "확인 필요"] },
    { key: "desiredResult", label: "원하는 결과", input: "select", options: ["취소", "감경", "변경", "재처분", "기타"] },
    { key: "caseBackground", label: "사건 경위", input: "textarea" },
    { key: "priorObjection", label: "기존 이의신청/민원 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "hasEvidence", label: "증거자료 보유 여부", input: "select", options: ["예", "아니오", "일부 보유"] },
    { key: "needsExecutionStay", label: "긴급 집행정지 필요 여부", input: "select", options: ["필요", "불필요", "확인 필요"] }
  ],
  fact_finding_contract: [
    { key: "workType", label: "업무 유형", input: "select", options: ["사실조사", "내용증명", "계약서 작성", "계약서 검토", "의견서", "기타"] },
    { key: "counterpartyType", label: "상대방 유형", input: "text" },
    { key: "mainFacts", label: "주요 사실관계", input: "textarea" },
    { key: "keyDates", label: "주요 날짜", input: "text" },
    { key: "hasDispute", label: "분쟁 여부", input: "select", options: ["있음", "없음", "가능성 있음"] },
    { key: "documentType", label: "원하는 문서 종류", input: "text" },
    { key: "hasExistingMaterials", label: "기존 계약서/자료 보유 여부", input: "select", options: ["예", "아니오", "일부 보유"] },
    { key: "finalUsePurpose", label: "최종 사용 목적", input: "textarea" },
    { key: "submissionOrDeliveryTarget", label: "제출 또는 발송 대상", input: "text" }
  ],
  permit_license: [
    { key: "permitType", label: "인허가 종류", input: "text" },
    { key: "targetAgency", label: "대상 기관", input: "text" },
    { key: "siteAddress", label: "사업장 또는 대상지 주소", input: "text" },
    { key: "currentStage", label: "현재 진행 단계", input: "text" },
    { key: "priorConsultationOrFiling", label: "기존 상담/접수 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "hasSupplementRequest", label: "보완 요구 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "desiredCompletionDate", label: "희망 완료 시점", input: "date" },
    { key: "hasPlansOrProof", label: "관련 도면/사업계획서/증빙 보유 여부", input: "select", options: ["예", "아니오", "일부 보유"] },
    { key: "businessType", label: "영업 형태 또는 업종", input: "text" }
  ],
  arabic_translation: [
    { key: "workType", label: "업무 유형", input: "select", options: ["번역", "통역", "번역+공증", "기관 제출용 문서", "기타"] },
    { key: "languageDirection", label: "언어 방향", input: "select", options: ["아랍어 → 한국어", "한국어 → 아랍어", "영어 포함", "기타"] },
    { key: "documentOrInterpretationField", label: "문서 종류 또는 통역 분야", input: "text" },
    { key: "interpretationMethod", label: "통역 방식", input: "select", options: ["방문", "전화", "화상", "동행", "해당 없음"] },
    { key: "interpretationScheduleOrDeadline", label: "통역 일정 또는 희망 납기", input: "text" },
    { key: "submissionAgencyOrUsePurpose", label: "제출 기관 또는 사용 목적", input: "text" },
    { key: "needsNotaryCertification", label: "공증/인증 필요 여부", input: "select", options: ["필요", "불필요", "확인 필요"] },
    { key: "needsApostilleOrConsular", label: "아포스티유/영사확인 필요 여부", input: "select", options: ["필요", "불필요", "확인 필요"] },
    { key: "hasOriginalFile", label: "원본 파일 보유 여부", input: "select", options: ["예", "아니오", "스캔본만 보유"] },
    { key: "volumeOrEstimatedTime", label: "분량 또는 예상 시간", input: "text" },
    { key: "nameTransliterationCheck", label: "이름/기관명 표기 방식 확인 필요 여부", input: "select", options: ["필요", "불필요", "확인 필요"] },
    { key: "hasSensitiveInfo", label: "민감 정보 포함 여부", input: "select", options: ["있음", "없음", "확인 필요"] }
  ],
  civil_petition: [
    { key: "civilPetitionType", label: "민원 세부 유형", input: "select", options: civilPetitionSubtypeValues },
    { key: "targetAgency", label: "대상 기관", input: "text" },
    { key: "petitionTargetOrCase", label: "민원 대상 또는 관련 사건", input: "textarea" },
    { key: "currentStage", label: "현재 진행 단계", input: "text" },
    { key: "priorConsultationOrFiling", label: "기존 접수/상담 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "desiredResult", label: "원하는 결과", input: "textarea" },
    { key: "petitionDocumentAvailability", label: "관련 서류 보유 여부", input: "select", options: documentAvailabilityOptions },
    { key: "urgentReason", label: "긴급 사유", input: "textarea" }
  ]
} as const;

export const civilPetitionSubtypeFields: Record<CivilPetitionSubtype, readonly IntakeCategoryDetailField[]> = {
  "자동차 등록": [
    { key: "vehicleRegistrationType", label: "차량 구분", input: "select", options: ["신규", "이전", "말소", "변경", "번호판", "기타"] },
    { key: "vehicleOwnerType", label: "차량 소유자 구분", input: "select", options: ["개인", "법인", "외국인", "공동명의"] },
    { key: "vehicleRegistrationArea", label: "차량 등록지", input: "text" },
    { key: "hasVehicleRegistrationCertificate", label: "자동차등록증 보유 여부", input: "select", options: ["예", "아니오", "확인 필요"] },
    { key: "hasTransferDeadline", label: "이전등록 기한 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "vehicleFineLienMortgageIssue", label: "과태료/압류/저당 관련 여부", input: "select", options: ["있음", "없음", "확인 필요"] }
  ],
  "일반 민원": [
    { key: "generalPetitionType", label: "민원 유형", input: "text" },
    { key: "generalTargetAgency", label: "대상 기관", input: "text" },
    { key: "hasPetitionReceiptNumber", label: "기존 민원 접수번호 보유 여부", input: "select", options: ["예", "아니오", "확인 필요"] },
    { key: "processingDeadline", label: "처리 기한", input: "date" },
    { key: "desiredAnswerOrAction", label: "원하는 답변 또는 조치", input: "textarea" }
  ],
  "고충 민원": [
    { key: "damageOrInconvenience", label: "피해 또는 불편 내용", input: "textarea" },
    { key: "relatedAgencyDepartment", label: "관련 기관/담당 부서", input: "text" },
    { key: "priorPetitionOrObjectionHistory", label: "기존 민원/이의신청 내역", input: "textarea" },
    { key: "desiredResolutionMethod", label: "원하는 해결 방식", input: "textarea" },
    { key: "hasSupportingEvidence", label: "증빙자료 보유 여부", input: "select", options: ["예", "아니오", "일부 보유"] }
  ],
  "정보 공개": [
    { key: "disclosureTargetAgency", label: "정보공개 대상 기관", input: "text" },
    { key: "requestedInformation", label: "요청하려는 정보 내용", input: "textarea" },
    { key: "disclosureUsePurpose", label: "사용 목적", input: "textarea" },
    { key: "preferredDisclosureMethod", label: "공개 방식 선호", input: "select", options: ["열람", "사본", "전자파일"] },
    { key: "priorNonDisclosureHistory", label: "비공개 또는 부분공개 이력 여부", input: "select", options: ["있음", "없음", "확인 필요"] },
    { key: "needsDisclosureObjection", label: "이의신청 필요 여부", input: "select", options: ["필요", "불필요", "확인 필요"] }
  ],
  기타: [
    { key: "otherPetitionType", label: "기타 민원 유형", input: "text" },
    { key: "otherPetitionDetails", label: "추가 설명", input: "textarea" }
  ]
} as const;

export function getCivilPetitionSubtypeFields(value: string | undefined) {
  if (!value || !(civilPetitionSubtypeValues as readonly string[]).includes(value)) {
    return [];
  }
  return civilPetitionSubtypeFields[value as CivilPetitionSubtype];
}

export function getCivilPetitionSubtypeFieldKeys() {
  return Object.values(civilPetitionSubtypeFields).flatMap((fields) => fields.map((field) => field.key));
}

export function getIntakeCategoryDetailLabel(category: IntakeCategory, key: string) {
  const categoryField = intakeCategoryDetailFields[category].find((field) => field.key === key);
  if (categoryField) return categoryField.label;

  if (category === "civil_petition") {
    for (const fields of Object.values(civilPetitionSubtypeFields)) {
      const subtypeField = fields.find((field) => field.key === key);
      if (subtypeField) return subtypeField.label;
    }
  }

  return key;
}
