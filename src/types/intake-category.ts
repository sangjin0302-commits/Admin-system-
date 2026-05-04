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

export type IntakeCategoryDisplayLocale = "ko" | "en";

const intakeCategoryEnglishLabels: Record<IntakeCategory, string> = {
  visa: "Visa",
  corporation: "Corporate services",
  administrative_appeal: "Administrative appeal",
  fact_finding_contract: "Fact investigation and contract drafting",
  permit_license: "Permits and licenses",
  arabic_translation: "Arabic translation and interpretation",
  civil_petition: "Other civil petitions"
};

const intakeCategoryEnglishHelp: Record<IntakeCategory, string> = {
  visa: "Review visa status, invitation, extension, change, denial, or departure-order issues.",
  corporation: "Review company setup, changes, foreign investment, branches, closures, and permit needs.",
  administrative_appeal: "Review the agency action, notice date, appeal deadline, and desired outcome.",
  fact_finding_contract: "Review facts, dispute context, documents needed, and submission or delivery purpose.",
  permit_license: "Review permit type, target agency, current stage, supplement requests, and business type.",
  arabic_translation: "Review Arabic translation, interpretation, notarization, certification, and agency submission needs.",
  civil_petition: "Review vehicle registration, information disclosure, grievance petitions, and other civil petitions."
};

const intakeCategoryEnglishGuidance: Record<IntakeCategory, string> = {
  visa: "We will check stay status, invitation, extension, change, and denial-response details.",
  corporation: "We will check incorporation, changes, foreign investment, branch offices, and liquidation details.",
  administrative_appeal: "We will check the disposition, appeal deadline, desired result, and need for suspension.",
  fact_finding_contract: "We will check facts, disputes, needed documents, and submission or delivery target.",
  permit_license: "We will check permit type, agency, progress stage, supplement requests, and industry details.",
  arabic_translation: "We will check translation, interpretation, notarization, certification, and agency submission purpose.",
  civil_petition: "We will check vehicle registration, information disclosure, grievances, and general civil petitions."
};

const intakeFieldEnglishLabels: Record<string, string> = {
  workType: "Service type",
  nationality: "Nationality",
  currentVisaStatus: "Current visa status",
  desiredVisaType: "Desired visa status",
  stayExpiryDate: "Stay expiry date",
  insideKorea: "Currently in Korea",
  familyAccompanying: "Family accompanying",
  priorDenialOrExitOrder: "Prior denial, refusal, or departure order",
  currentDocuments: "Current documents",
  urgentReason: "Urgent reason",
  corporationType: "Corporation type",
  representativeNationality: "Representative nationality",
  shareholderOfficerStructure: "Shareholder/officer structure",
  businessPurpose: "Business purpose",
  capitalAmount: "Capital amount",
  hasBusinessAddress: "Business address available",
  requiredPermit: "Required permit or license",
  foreignInvestorOrHq: "Foreign investor or overseas headquarters",
  agency: "Disposition agency",
  dispositionName: "Disposition name",
  noticeDate: "Notice date",
  hasDispositionNotice: "Disposition notice available",
  knowsAppealDeadline: "Appeal deadline known",
  desiredResult: "Desired result",
  caseBackground: "Case background",
  priorObjection: "Prior objection or civil petition",
  hasEvidence: "Evidence available",
  needsExecutionStay: "Need urgent suspension",
  counterpartyType: "Counterparty type",
  mainFacts: "Main facts",
  keyDates: "Key dates",
  hasDispute: "Dispute status",
  documentType: "Desired document type",
  hasExistingMaterials: "Existing contract or materials available",
  finalUsePurpose: "Final use purpose",
  submissionOrDeliveryTarget: "Submission or delivery target",
  permitType: "Permit or license type",
  targetAgency: "Target agency",
  siteAddress: "Business site or target address",
  currentStage: "Current stage",
  priorConsultationOrFiling: "Prior consultation or filing",
  hasSupplementRequest: "Supplement request received",
  desiredCompletionDate: "Desired completion date",
  hasPlansOrProof: "Plans, business plan, or proof available",
  businessType: "Business type or industry",
  languageDirection: "Language direction",
  documentOrInterpretationField: "Document type or interpretation field",
  interpretationMethod: "Interpretation method",
  interpretationScheduleOrDeadline: "Interpretation schedule or desired deadline",
  submissionAgencyOrUsePurpose: "Submission agency or use purpose",
  needsNotaryCertification: "Notarization or certification needed",
  needsApostilleOrConsular: "Apostille or consular confirmation needed",
  hasOriginalFile: "Original file available",
  volumeOrEstimatedTime: "Volume or estimated time",
  nameTransliterationCheck: "Name or institution spelling confirmation needed",
  hasSensitiveInfo: "Contains sensitive information",
  civilPetitionType: "Petition subtype",
  petitionTargetOrCase: "Petition target or related case",
  petitionDocumentAvailability: "Related documents available",
  vehicleRegistrationType: "Vehicle registration type",
  vehicleOwnerType: "Vehicle owner type",
  vehicleRegistrationArea: "Vehicle registration area",
  hasVehicleRegistrationCertificate: "Vehicle registration certificate available",
  hasTransferDeadline: "Transfer registration deadline",
  vehicleFineLienMortgageIssue: "Fine, seizure, or mortgage issue",
  generalPetitionType: "Petition type",
  generalTargetAgency: "Target agency",
  hasPetitionReceiptNumber: "Existing petition receipt number available",
  processingDeadline: "Processing deadline",
  desiredAnswerOrAction: "Desired answer or action",
  damageOrInconvenience: "Damage or inconvenience",
  relatedAgencyDepartment: "Related agency or department",
  priorPetitionOrObjectionHistory: "Prior petition or objection history",
  desiredResolutionMethod: "Desired resolution method",
  hasSupportingEvidence: "Supporting evidence available",
  disclosureTargetAgency: "Information disclosure target agency",
  requestedInformation: "Information requested",
  disclosureUsePurpose: "Use purpose",
  preferredDisclosureMethod: "Preferred disclosure method",
  priorNonDisclosureHistory: "Prior non-disclosure or partial disclosure history",
  needsDisclosureObjection: "Need objection to disclosure decision",
  otherPetitionType: "Other petition type",
  otherPetitionDetails: "Additional details"
};

const intakeFieldEnglishOptions: Record<string, readonly string[]> = {
  workType: ["New", "Extension", "Change", "Invitation", "Denial response", "Departure-order response", "Other"],
  insideKorea: ["Yes", "No", "Need confirmation"],
  familyAccompanying: ["Yes", "No", "Undecided"],
  priorDenialOrExitOrder: ["Yes", "No", "Need confirmation"],
  hasBusinessAddress: ["Yes", "No", "Planned"],
  foreignInvestorOrHq: ["Yes", "No", "Need confirmation"],
  hasDispositionNotice: ["Yes", "No", "Need confirmation"],
  knowsAppealDeadline: ["Yes", "No", "Need confirmation"],
  desiredResult: ["Cancellation", "Reduction", "Change", "New disposition", "Other"],
  priorObjection: ["Yes", "No", "Need confirmation"],
  hasEvidence: ["Yes", "No", "Partially available"],
  needsExecutionStay: ["Needed", "Not needed", "Need confirmation"],
  hasDispute: ["Yes", "No", "Possible"],
  hasExistingMaterials: ["Yes", "No", "Partially available"],
  priorConsultationOrFiling: ["Yes", "No", "Need confirmation"],
  hasSupplementRequest: ["Yes", "No", "Need confirmation"],
  hasPlansOrProof: ["Yes", "No", "Partially available"],
  languageDirection: ["Arabic to Korean", "Korean to Arabic", "Includes English", "Other"],
  interpretationMethod: ["In-person", "Phone", "Video call", "Accompaniment", "Not applicable"],
  needsNotaryCertification: ["Needed", "Not needed", "Need confirmation"],
  needsApostilleOrConsular: ["Needed", "Not needed", "Need confirmation"],
  hasOriginalFile: ["Yes", "No", "Only scan/photo available"],
  nameTransliterationCheck: ["Needed", "Not needed", "Need confirmation"],
  hasSensitiveInfo: ["Yes", "No", "Need confirmation"],
  civilPetitionType: [
    "Vehicle registration",
    "General civil petition",
    "Grievance petition",
    "Information disclosure request",
    "Other"
  ],
  petitionDocumentAvailability: ["Documents available", "Partially available", "Not yet available", "Need confirmation"],
  vehicleRegistrationType: ["New", "Transfer", "Cancellation", "Change", "License plate", "Other"],
  vehicleOwnerType: ["Individual", "Corporation", "Foreigner", "Joint ownership"],
  hasVehicleRegistrationCertificate: ["Yes", "No", "Need confirmation"],
  hasTransferDeadline: ["Yes", "No", "Need confirmation"],
  vehicleFineLienMortgageIssue: ["Yes", "No", "Need confirmation"],
  hasPetitionReceiptNumber: ["Yes", "No", "Need confirmation"],
  hasSupportingEvidence: ["Yes", "No", "Partially available"],
  preferredDisclosureMethod: ["Inspection", "Copy", "Electronic file"],
  priorNonDisclosureHistory: ["Yes", "No", "Need confirmation"],
  needsDisclosureObjection: ["Needed", "Not needed", "Need confirmation"]
};

const arabicTranslationWorkTypeEnglishOptions = [
  "Translation",
  "Interpretation",
  "Translation + notarization",
  "Documents for agency submission",
  "Other"
] as const;

const corporationWorkTypeEnglishOptions = [
  "Incorporation",
  "Change",
  "Foreign investment",
  "Branch or liaison office",
  "Closure or liquidation",
  "Other"
] as const;

const factFindingWorkTypeEnglishOptions = [
  "Fact investigation",
  "Certified content letter",
  "Contract drafting",
  "Contract review",
  "Opinion letter",
  "Other"
] as const;

function getWorkTypeEnglishOptions(category: IntakeCategory | null) {
  if (category === "arabic_translation") return arabicTranslationWorkTypeEnglishOptions;
  if (category === "corporation") return corporationWorkTypeEnglishOptions;
  if (category === "fact_finding_contract") return factFindingWorkTypeEnglishOptions;
  return intakeFieldEnglishOptions.workType;
}

export function getLocalizedIntakeCategoryLabel(
  category: IntakeCategory,
  locale: IntakeCategoryDisplayLocale
) {
  return locale === "en" ? intakeCategoryEnglishLabels[category] : intakeCategoryLabels[category];
}

export function getLocalizedIntakeCategoryHelp(
  category: IntakeCategory,
  locale: IntakeCategoryDisplayLocale
) {
  return locale === "en" ? intakeCategoryEnglishHelp[category] : null;
}

export function getLocalizedIntakeCategoryGuidance(
  category: IntakeCategory,
  locale: IntakeCategoryDisplayLocale
) {
  return locale === "en" ? intakeCategoryEnglishGuidance[category] : null;
}

export function getLocalizedIntakeFieldLabel(
  field: IntakeCategoryDetailField,
  locale: IntakeCategoryDisplayLocale
) {
  return locale === "en" ? intakeFieldEnglishLabels[field.key] ?? field.label : field.label;
}

export function getLocalizedIntakeOptionLabel(input: {
  category: IntakeCategory | null;
  field: IntakeCategoryDetailField;
  option: string;
  locale: IntakeCategoryDisplayLocale;
}) {
  if (input.locale !== "en") return input.option;
  const options =
    input.field.key === "workType"
      ? getWorkTypeEnglishOptions(input.category)
      : intakeFieldEnglishOptions[input.field.key];
  const optionIndex = input.field.options?.indexOf(input.option) ?? -1;
  return optionIndex >= 0 ? options?.[optionIndex] ?? input.option : input.option;
}
