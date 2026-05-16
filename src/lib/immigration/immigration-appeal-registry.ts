export const immigrationMatterCategories = [
  "immigration_appeal",
  "immigration_stay",
  "immigration_compliance",
  "immigration_document_support"
] as const;

export type ImmigrationMatterCategory = (typeof immigrationMatterCategories)[number];

export const immigrationDeadlineFields = [
  "dispositionDate",
  "noticeDate",
  "serviceDate",
  "appealDeadline",
  "departureDeadline",
  "detentionStartDate",
  "stayExpiryDate",
  "submissionDeadline",
  "supplementDeadline",
  "resultExpectedDate"
] as const;

export type ImmigrationDeadlineField = (typeof immigrationDeadlineFields)[number];

export const immigrationDueDatePriority = [
  "appealDeadline",
  "departureDeadline",
  "supplementDeadline",
  "stayExpiryDate",
  "submissionDeadline"
] as const satisfies readonly ImmigrationDeadlineField[];

export type ImmigrationDocumentRiskLevel = "low" | "medium" | "high";
export type ImmigrationGuardrailSeverity = "info" | "warn" | "critical";

export type ImmigrationMatterTypeDefinition = {
  matterType: string;
  labelKo: string;
  labelEn: string;
  category: ImmigrationMatterCategory;
  descriptionKo: string;
  typicalAgency: string;
  deadlinePriority: readonly ImmigrationDeadlineField[];
  requiredDocumentTemplateIds: readonly string[];
  draftTemplateCandidateIds: readonly string[];
  safetyGuardrailIds: readonly string[];
};

export type ImmigrationDispositionTypeDefinition = {
  code: string;
  labelKo: string;
  descriptionKo: string;
  defaultMatterTypes: readonly string[];
};

export type ImmigrationDeadlineFieldDefinition = {
  field: ImmigrationDeadlineField;
  labelKo: string;
  descriptionKo: string;
  isCritical: boolean;
  usedForDueDatePriority: boolean;
};

export type ImmigrationRequiredDocumentTemplate = {
  id: string;
  labelKo: string;
  descriptionKo: string;
  required: boolean;
  sensitive: boolean;
  securityNoteKo: string | null;
  recommendedForMatterTypes: readonly string[];
};

export type ImmigrationDraftTemplateCandidate = {
  id: string;
  labelKo: string;
  descriptionKo: string;
  riskLevel: ImmigrationDocumentRiskLevel;
  adminOnlyPreview: boolean;
  requiresScopeReview: boolean;
  requiresOfficialFormCheck: boolean;
};

export type ImmigrationSafetyGuardrail = {
  id: string;
  labelKo: string;
  descriptionKo: string;
  severity: ImmigrationGuardrailSeverity;
  appliesToMatterTypes: readonly string[];
};

export type ImmigrationMatterTypeOption = {
  value: ImmigrationMatterType;
  label: string;
  category: ImmigrationMatterCategory;
  description: string;
};

type ImmigrationRequiredDocumentTemplateInput = readonly [
  id: string,
  labelKo: string,
  descriptionKo: string,
  required: boolean,
  sensitive: boolean
];

type ImmigrationSafetyGuardrailInput = readonly [
  id: string,
  labelKo: string,
  descriptionKo: string,
  severity: ImmigrationGuardrailSeverity
];

const commonGuardrails = [
  "verify_original_disposition_document",
  "verify_service_date",
  "verify_deadline_manually",
  "verify_jurisdiction",
  "verify_latest_official_form",
  "check_administrative_scrivener_scope",
  "check_attorney_scope_risk",
  "no_ai_legal_conclusion",
  "no_ai_customer_submission",
  "admin_approval_required",
  "sensitive_identity_data_protection",
  "no_file_upload_before_security_design"
] as const;

const appealDrafts = [
  "fact_summary",
  "submitted_evidence_list",
  "evidence_index",
  "explanation_statement",
  "personal_statement",
  "petition",
  "mitigation_statement",
  "administrative_appeal_petition_draft",
  "stay_of_execution_application_draft"
] as const;

const stayDrafts = [
  "fact_summary",
  "submitted_evidence_list",
  "evidence_index",
  "explanation_statement",
  "personal_statement",
  "stay_extension_or_change_reason_statement"
] as const;

export const immigrationMatterTypeDefinitions = [
  {
    matterType: "deportation_order_appeal",
    labelKo: "강제퇴거명령 불복",
    labelEn: "Deportation order appeal",
    category: "immigration_appeal",
    descriptionKo: "강제퇴거명령, 보호 조치, 송달일, 행정심판 기한을 함께 관리하는 사건입니다.",
    typicalAgency: "출입국·외국인청 / 중앙행정심판위원회",
    deadlinePriority: immigrationDueDatePriority,
    requiredDocumentTemplateIds: [
      "deportation_order_notice",
      "detention_or_protection_notice",
      "service_date_evidence",
      "immigration_history",
      "family_relationship_evidence",
      "residence_evidence",
      "violation_context_evidence",
      "mitigation_evidence",
      "administrative_appeal_draft_material",
      "stay_of_execution_review_material"
    ],
    draftTemplateCandidateIds: appealDrafts,
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "departure_order_appeal",
    labelKo: "출국명령 불복",
    labelEn: "Departure order appeal",
    category: "immigration_appeal",
    descriptionKo: "출국명령서, 출국기한, 송달일, 체류 계속 필요성을 관리하는 사건입니다.",
    typicalAgency: "출입국·외국인청 / 중앙행정심판위원회",
    deadlinePriority: immigrationDueDatePriority,
    requiredDocumentTemplateIds: [
      "departure_order_notice",
      "departure_deadline_evidence",
      "service_date_evidence",
      "stay_status_evidence",
      "residence_evidence",
      "statement"
    ],
    draftTemplateCandidateIds: appealDrafts,
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "departure_recommendation_response",
    labelKo: "출국권고 대응",
    labelEn: "Departure recommendation response",
    category: "immigration_compliance",
    descriptionKo: "출국권고 이후 자진출국 또는 체류 유지 소명 자료를 정리하는 사건입니다.",
    typicalAgency: "출입국·외국인청",
    deadlinePriority: ["departureDeadline", "submissionDeadline", "supplementDeadline"],
    requiredDocumentTemplateIds: ["disposition_notice", "immigration_history", "statement", "mitigation_evidence"],
    draftTemplateCandidateIds: ["fact_summary", "explanation_statement", "personal_statement"],
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "entry_ban_response",
    labelKo: "입국금지 대응",
    labelEn: "Entry ban response",
    category: "immigration_compliance",
    descriptionKo: "입국금지, 재입국 제한, 입국 거부 가능성에 대한 사유와 증빙을 정리하는 사건입니다.",
    typicalAgency: "출입국·외국인청 / 재외공관",
    deadlinePriority: ["submissionDeadline", "supplementDeadline", "resultExpectedDate"],
    requiredDocumentTemplateIds: ["disposition_notice", "immigration_history", "family_relationship_evidence", "petition"],
    draftTemplateCandidateIds: ["fact_summary", "submitted_evidence_list", "explanation_statement", "petition"],
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "stay_extension_denial_appeal",
    labelKo: "체류기간 연장 불허 불복",
    labelEn: "Stay extension denial appeal",
    category: "immigration_appeal",
    descriptionKo: "체류기간 연장 불허 통지, 체류만료일, 연장 필요 사유를 관리하는 사건입니다.",
    typicalAgency: "출입국·외국인청 / 중앙행정심판위원회",
    deadlinePriority: ["appealDeadline", "stayExpiryDate", "supplementDeadline", "submissionDeadline"],
    requiredDocumentTemplateIds: [
      "extension_denial_notice",
      "current_stay_status_evidence",
      "stay_expiry_evidence",
      "extension_reason_evidence",
      "employment_business_school_evidence",
      "family_or_medical_evidence",
      "statement"
    ],
    draftTemplateCandidateIds: stayDrafts,
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "status_change_denial_appeal",
    labelKo: "체류자격 변경 불허 불복",
    labelEn: "Status change denial appeal",
    category: "immigration_appeal",
    descriptionKo: "체류자격 변경 불허 통지와 요건 충족 자료를 관리하는 사건입니다.",
    typicalAgency: "출입국·외국인청 / 중앙행정심판위원회",
    deadlinePriority: ["appealDeadline", "stayExpiryDate", "supplementDeadline", "submissionDeadline"],
    requiredDocumentTemplateIds: [
      "status_change_denial_notice",
      "current_stay_status_evidence",
      "status_change_reason_evidence",
      "eligibility_evidence",
      "statement"
    ],
    draftTemplateCandidateIds: stayDrafts,
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "overstay_penalty_response",
    labelKo: "체류기간 도과·범칙 대응",
    labelEn: "Overstay penalty response",
    category: "immigration_compliance",
    descriptionKo: "체류기간 도과, 과태료, 범칙금, 위반통지 대응 자료를 정리하는 사건입니다.",
    typicalAgency: "출입국·외국인청",
    deadlinePriority: ["departureDeadline", "submissionDeadline", "supplementDeadline"],
    requiredDocumentTemplateIds: ["stay_expiry_evidence", "penalty_or_violation_notice", "violation_context_evidence", "reflection_or_explanation_letter"],
    draftTemplateCandidateIds: ["fact_summary", "explanation_statement", "mitigation_statement"],
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "immigration_offense_review",
    labelKo: "출입국 사범심사 대응",
    labelEn: "Immigration offense review",
    category: "immigration_compliance",
    descriptionKo: "사범심사 출석, 위반 경위, 처분 가능성을 정리하는 사건입니다.",
    typicalAgency: "출입국·외국인청",
    deadlinePriority: ["submissionDeadline", "supplementDeadline", "resultExpectedDate"],
    requiredDocumentTemplateIds: ["offense_review_notice", "violation_context_evidence", "immigration_history", "mitigation_evidence", "statement"],
    draftTemplateCandidateIds: ["fact_summary", "personal_statement", "explanation_statement", "mitigation_statement"],
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "detention_or_protection_review",
    labelKo: "보호명령·보호 이슈 검토",
    labelEn: "Detention or protection review",
    category: "immigration_appeal",
    descriptionKo: "보호 개시일, 보호 관련 통지, 보호해제 소명 자료를 관리하는 사건입니다.",
    typicalAgency: "출입국·외국인청 / 보호소",
    deadlinePriority: ["appealDeadline", "detentionStartDate", "submissionDeadline", "supplementDeadline"],
    requiredDocumentTemplateIds: ["detention_or_protection_notice", "detention_start_evidence", "residence_evidence", "family_relationship_evidence", "mitigation_evidence"],
    draftTemplateCandidateIds: ["fact_summary", "submitted_evidence_list", "explanation_statement", "petition"],
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "refugee_or_humanitarian_status",
    labelKo: "난민·인도적 체류 처분 대응",
    labelEn: "Refugee or humanitarian status",
    category: "immigration_appeal",
    descriptionKo: "난민 불인정, 인도적 체류 관련 통지와 본국 사정 자료를 정리하는 사건입니다.",
    typicalAgency: "출입국·외국인청 / 난민 관련 심사기관",
    deadlinePriority: ["appealDeadline", "submissionDeadline", "supplementDeadline"],
    requiredDocumentTemplateIds: ["refugee_or_humanitarian_notice", "country_condition_evidence", "personal_statement", "evidence_index"],
    draftTemplateCandidateIds: ["fact_summary", "personal_statement", "submitted_evidence_list", "evidence_index"],
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "visa_issuance_support",
    labelKo: "사증 발급 지원",
    labelEn: "Visa issuance support",
    category: "immigration_document_support",
    descriptionKo: "비자 발급, 초청, 입국 목적 소명 자료를 준비하는 사건입니다.",
    typicalAgency: "재외공관 / 출입국·외국인청",
    deadlinePriority: ["submissionDeadline", "supplementDeadline", "resultExpectedDate"],
    requiredDocumentTemplateIds: ["passport", "invitation_or_purpose_evidence", "family_relationship_evidence", "income_tax_evidence"],
    draftTemplateCandidateIds: ["submitted_evidence_list", "explanation_statement"],
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "residence_status_document_support",
    labelKo: "체류자격 자료 준비 지원",
    labelEn: "Residence status document support",
    category: "immigration_stay",
    descriptionKo: "체류자격 연장·변경·자격외활동 자료를 준비하는 사건입니다.",
    typicalAgency: "출입국·외국인청",
    deadlinePriority: ["stayExpiryDate", "submissionDeadline", "supplementDeadline"],
    requiredDocumentTemplateIds: ["current_stay_status_evidence", "stay_expiry_evidence", "employment_business_school_evidence", "income_tax_evidence"],
    draftTemplateCandidateIds: ["submitted_evidence_list", "stay_extension_or_change_reason_statement"],
    safetyGuardrailIds: commonGuardrails
  },
  {
    matterType: "general_immigration_statement",
    labelKo: "일반 출입국 진술·소명",
    labelEn: "General immigration statement",
    category: "immigration_document_support",
    descriptionKo: "일반 출입국 소명, 진술서, 사실확인서 작성을 지원하는 사건입니다.",
    typicalAgency: "출입국·외국인청",
    deadlinePriority: ["submissionDeadline", "supplementDeadline", "resultExpectedDate"],
    requiredDocumentTemplateIds: ["statement", "fact_confirmation", "immigration_history", "mitigation_evidence"],
    draftTemplateCandidateIds: ["fact_summary", "personal_statement", "explanation_statement", "submitted_evidence_list"],
    safetyGuardrailIds: commonGuardrails
  }
] as const satisfies readonly ImmigrationMatterTypeDefinition[];

export type ImmigrationMatterType = (typeof immigrationMatterTypeDefinitions)[number]["matterType"];

export const immigrationDispositionTypeDefinitions = [
  {
    code: "DEPORTATION_ORDER",
    labelKo: "강제퇴거명령",
    descriptionKo: "강제퇴거명령 또는 관련 보호 조치가 쟁점인 처분입니다.",
    defaultMatterTypes: ["deportation_order_appeal"]
  },
  {
    code: "DEPARTURE_ORDER",
    labelKo: "출국명령",
    descriptionKo: "출국기한과 불복/소명 가능성이 함께 관리되어야 하는 처분입니다.",
    defaultMatterTypes: ["departure_order_appeal"]
  },
  {
    code: "DEPARTURE_RECOMMENDATION",
    labelKo: "출국권고",
    descriptionKo: "자진출국 또는 체류 유지 소명 전략을 검토하는 이슈입니다.",
    defaultMatterTypes: ["departure_recommendation_response"]
  },
  {
    code: "ENTRY_BAN",
    labelKo: "입국금지",
    descriptionKo: "입국금지, 재입국 제한, 입국 거부 가능성이 쟁점인 처분입니다.",
    defaultMatterTypes: ["entry_ban_response"]
  },
  {
    code: "STAY_EXTENSION_DENIAL",
    labelKo: "체류기간 연장 불허",
    descriptionKo: "체류기간 연장 불허와 체류만료일 대응이 필요한 처분입니다.",
    defaultMatterTypes: ["stay_extension_denial_appeal"]
  },
  {
    code: "STATUS_CHANGE_DENIAL",
    labelKo: "체류자격 변경 불허",
    descriptionKo: "체류자격 변경 신청 불허와 요건 충족 소명이 필요한 처분입니다.",
    defaultMatterTypes: ["status_change_denial_appeal"]
  },
  {
    code: "IMMIGRATION_OFFENSE_REVIEW",
    labelKo: "사범심사",
    descriptionKo: "출입국 위반 사실, 출석, 처분 가능성을 확인하는 절차입니다.",
    defaultMatterTypes: ["immigration_offense_review"]
  },
  {
    code: "DETENTION_OR_PROTECTION",
    labelKo: "보호명령/보호 관련 이슈",
    descriptionKo: "보호 개시, 보호기간, 보호해제 가능성이 쟁점인 이슈입니다.",
    defaultMatterTypes: ["detention_or_protection_review"]
  },
  {
    code: "PENALTY_OR_VIOLATION_NOTICE",
    labelKo: "과태료/범칙금/위반통지",
    descriptionKo: "체류기간 도과, 범칙금, 과태료 또는 위반통지가 쟁점인 이슈입니다.",
    defaultMatterTypes: ["overstay_penalty_response"]
  },
  {
    code: "REFUGEE_HUMANITARIAN",
    labelKo: "난민/인도적 체류 관련 처분",
    descriptionKo: "난민 불인정 또는 인도적 체류 관련 통지가 쟁점인 처분입니다.",
    defaultMatterTypes: ["refugee_or_humanitarian_status"]
  },
  {
    code: "OTHER_IMMIGRATION_DISPOSITION",
    labelKo: "기타 출입국 행정처분",
    descriptionKo: "다른 코드로 분류하기 어려운 출입국·체류 관련 처분입니다.",
    defaultMatterTypes: ["general_immigration_statement"]
  }
] as const satisfies readonly ImmigrationDispositionTypeDefinition[];

export const immigrationDeadlineFieldDefinitions = [
  {
    field: "dispositionDate",
    labelKo: "처분일",
    descriptionKo: "행정처분이 이루어진 날짜입니다.",
    isCritical: true,
    usedForDueDatePriority: false
  },
  {
    field: "noticeDate",
    labelKo: "통지일",
    descriptionKo: "처분 또는 보완 요구를 통지받은 날짜입니다.",
    isCritical: true,
    usedForDueDatePriority: false
  },
  {
    field: "serviceDate",
    labelKo: "송달일",
    descriptionKo: "처분서 또는 통지서 송달 기준일입니다.",
    isCritical: true,
    usedForDueDatePriority: false
  },
  {
    field: "appealDeadline",
    labelKo: "불복/신청 기한",
    descriptionKo: "행정심판, 이의신청, 기타 불복 절차 검토 기한입니다.",
    isCritical: true,
    usedForDueDatePriority: true
  },
  {
    field: "departureDeadline",
    labelKo: "출국기한",
    descriptionKo: "출국명령, 권고 또는 관련 처분상 출국 기준일입니다.",
    isCritical: true,
    usedForDueDatePriority: true
  },
  {
    field: "detentionStartDate",
    labelKo: "보호 개시일",
    descriptionKo: "보호명령 또는 보호 관련 절차가 시작된 날짜입니다.",
    isCritical: true,
    usedForDueDatePriority: false
  },
  {
    field: "stayExpiryDate",
    labelKo: "체류기간 만료일",
    descriptionKo: "현재 체류자격의 만료일입니다.",
    isCritical: true,
    usedForDueDatePriority: true
  },
  {
    field: "submissionDeadline",
    labelKo: "제출기한",
    descriptionKo: "기관 제출 또는 자료 제출의 기준 기한입니다.",
    isCritical: true,
    usedForDueDatePriority: true
  },
  {
    field: "supplementDeadline",
    labelKo: "보완기한",
    descriptionKo: "보완 요청에 대한 대응 기한입니다.",
    isCritical: true,
    usedForDueDatePriority: true
  },
  {
    field: "resultExpectedDate",
    labelKo: "결과 예상일",
    descriptionKo: "기관 판단 또는 결과 수령 예상일입니다.",
    isCritical: false,
    usedForDueDatePriority: false
  }
] as const satisfies readonly ImmigrationDeadlineFieldDefinition[];

const immigrationRequiredDocumentTemplateInputs: readonly ImmigrationRequiredDocumentTemplateInput[] = [
  ["disposition_notice", "처분 통지서", "처분 또는 이슈의 기준이 되는 공식 통지서입니다.", true, true],
  ["written_order", "명령서", "강제퇴거명령서, 출국명령서 등 공식 명령서입니다.", true, true],
  ["passport", "여권", "신원과 출입국 이력 확인에 필요한 여권 자료입니다.", true, true],
  ["alien_registration_card", "외국인등록증", "체류자격과 신원 확인에 필요한 자료입니다.", true, true],
  ["immigration_history", "출입국/체류 이력 자료", "입국일, 체류기간, 과거 출입국 이력을 확인하는 자료입니다.", true, true],
  ["family_relationship_evidence", "가족관계 증빙", "국내 가족관계와 생활기반을 확인하는 자료입니다.", false, true],
  ["residence_evidence", "거주지 증빙", "국내 거주지와 생활기반을 확인하는 자료입니다.", false, true],
  ["employment_business_school_evidence", "고용/사업/학업 증빙", "국내 직장, 사업장, 학교 관련 자료입니다.", false, true],
  ["income_tax_evidence", "소득/납세 자료", "소득, 납세, 경제활동을 확인하는 자료입니다.", false, true],
  ["statement", "진술서", "본인 사실관계와 사유를 정리한 자료입니다.", false, false],
  ["fact_confirmation", "사실확인서", "제3자 또는 관계자가 사실관계를 확인하는 자료입니다.", false, false],
  ["petition", "탄원서", "정상참작 또는 선처를 요청하는 자료입니다.", false, false],
  ["reflection_or_explanation_letter", "반성문/소명서", "위반 경위와 정상참작 사유를 정리한 자료입니다.", false, false],
  ["mitigation_evidence", "정상참작 자료", "가족, 직장, 건강, 학업, 납세 등 참작 사유 자료입니다.", false, true],
  ["deportation_order_notice", "강제퇴거명령서", "강제퇴거명령의 원문 확인 자료입니다.", true, true],
  ["detention_or_protection_notice", "보호명령/통지서", "보호명령 또는 보호 관련 통지 자료입니다.", false, true],
  ["service_date_evidence", "송달일 확인 자료", "불복기한 산정을 위한 송달일 확인 자료입니다.", true, false],
  ["violation_context_evidence", "위반 경위 소명자료", "위반 발생 경위와 참작 사유를 확인하는 자료입니다.", false, true],
  ["administrative_appeal_draft_material", "행정심판 청구서 초안 자료", "행정심판 청구서 초안 작성을 위한 기초 자료입니다.", false, true],
  ["stay_of_execution_review_material", "집행정지 신청 검토 자료", "집행정지 신청 검토에 필요한 기초 자료입니다.", false, true],
  ["departure_order_notice", "출국명령서", "출국명령의 원문 확인 자료입니다.", true, true],
  ["departure_deadline_evidence", "출국기한 확인 자료", "출국기한 산정을 위한 자료입니다.", true, false],
  ["stay_status_evidence", "체류자격/체류기간 자료", "현재 체류자격과 체류기간을 확인하는 자료입니다.", true, true],
  ["extension_denial_notice", "연장 불허 통지서", "체류기간 연장 불허 통지 원문입니다.", true, true],
  ["current_stay_status_evidence", "기존 체류자격 자료", "기존 체류자격과 요건을 확인하는 자료입니다.", true, true],
  ["stay_expiry_evidence", "체류기간 만료일 자료", "체류만료일 확인 자료입니다.", true, true],
  ["extension_reason_evidence", "연장 필요 사유 자료", "체류기간 연장이 필요한 사유와 증빙입니다.", false, true],
  ["family_or_medical_evidence", "가족/치료 관련 증빙", "가족관계, 건강, 치료 등 체류 필요성을 보강하는 자료입니다.", false, true],
  ["status_change_denial_notice", "변경 불허 통지서", "체류자격 변경 불허 통지 원문입니다.", true, true],
  ["status_change_reason_evidence", "변경 신청 사유 자료", "체류자격 변경 신청 사유를 설명하는 자료입니다.", false, true],
  ["eligibility_evidence", "요건 충족 증빙", "체류자격 변경 요건 충족 여부를 확인하는 자료입니다.", true, true],
  ["penalty_or_violation_notice", "과태료/범칙금/위반통지", "출입국 위반 또는 납부 관련 공식 통지입니다.", true, true],
  ["offense_review_notice", "사범심사 출석/통지 자료", "사범심사 관련 출석요구 또는 통지 자료입니다.", true, true],
  ["detention_start_evidence", "보호 개시일 확인 자료", "보호 개시일과 보호 관련 기준일을 확인하는 자료입니다.", true, true],
  ["refugee_or_humanitarian_notice", "난민/인도적 체류 처분 통지", "난민 또는 인도적 체류 관련 처분 통지입니다.", true, true],
  ["country_condition_evidence", "본국 사정 자료", "귀국 위험 또는 보호 필요성을 설명하는 자료입니다.", false, true],
  ["personal_statement", "본인 진술 자료", "개별 사정과 사실관계를 설명하는 진술 자료입니다.", false, true],
  ["evidence_index", "증거목록 자료", "제출 증거를 구조화하기 위한 자료입니다.", false, false],
  ["invitation_or_purpose_evidence", "초청/입국 목적 증빙", "사증 발급 또는 입국 목적을 설명하는 자료입니다.", false, true]
];

export const immigrationRequiredDocumentTemplates = immigrationRequiredDocumentTemplateInputs.map(([id, labelKo, descriptionKo, required, sensitive]) => ({
  id,
  labelKo,
  descriptionKo,
  required,
  sensitive,
  securityNoteKo: sensitive ? "민감정보 포함 가능성이 있으므로 파일 보안/접근로그 설계 전까지 원문 저장을 보류합니다." : null,
  recommendedForMatterTypes: immigrationMatterTypeDefinitions
    .filter((matterType) => (matterType.requiredDocumentTemplateIds as readonly string[]).includes(id))
    .map((matterType) => matterType.matterType)
})) as readonly ImmigrationRequiredDocumentTemplate[];

export const immigrationDraftTemplateCandidates = [
  {
    id: "fact_summary",
    labelKo: "사실관계 정리서",
    descriptionKo: "처분 경위, 체류 이력, 핵심 쟁점을 시간순으로 정리하는 초안입니다.",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: false,
    requiresOfficialFormCheck: false
  },
  {
    id: "submitted_evidence_list",
    labelKo: "제출자료 목록",
    descriptionKo: "기관 제출 자료를 누락 없이 정리하기 위한 목록 초안입니다.",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: false,
    requiresOfficialFormCheck: false
  },
  {
    id: "evidence_index",
    labelKo: "증거목록",
    descriptionKo: "증거번호, 자료명, 입증취지를 정리하는 초안입니다.",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: false,
    requiresOfficialFormCheck: false
  },
  {
    id: "explanation_statement",
    labelKo: "사유서/소명서",
    descriptionKo: "사실관계와 정상참작 사유를 설명하는 초안입니다.",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: false
  },
  {
    id: "personal_statement",
    labelKo: "진술서",
    descriptionKo: "본인 진술을 정리하는 초안입니다.",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: false
  },
  {
    id: "petition",
    labelKo: "탄원서",
    descriptionKo: "관계자 탄원 취지를 정리하는 초안입니다.",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: false
  },
  {
    id: "mitigation_statement",
    labelKo: "정상참작 사유서",
    descriptionKo: "가족, 직장, 학업, 건강 등 참작 사유를 정리하는 초안입니다.",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: false
  },
  {
    id: "administrative_appeal_petition_draft",
    labelKo: "행정심판 청구서 초안",
    descriptionKo: "행정심판 청구서 형식 검토를 위한 관리자 전용 초안입니다.",
    riskLevel: "high",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: true
  },
  {
    id: "stay_of_execution_application_draft",
    labelKo: "집행정지 신청서 초안",
    descriptionKo: "집행정지 신청서 형식 검토를 위한 관리자 전용 초안입니다.",
    riskLevel: "high",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: true
  },
  {
    id: "stay_extension_or_change_reason_statement",
    labelKo: "체류자격 변경/연장 사유서",
    descriptionKo: "체류자격 변경 또는 연장 사유를 정리하는 초안입니다.",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: true
  }
] as const satisfies readonly ImmigrationDraftTemplateCandidate[];

const immigrationSafetyGuardrailInputs: readonly ImmigrationSafetyGuardrailInput[] = [
  ["verify_original_disposition_document", "처분서 원문 확인", "처분서 원문 확인 전 기한이나 쟁점을 확정하지 않습니다.", "critical"],
  ["verify_service_date", "송달일 확인", "불복기한 산정 전 송달일 확인 필요 표시를 유지합니다.", "critical"],
  ["verify_deadline_manually", "제출기한 수동 확인", "시스템 계산 기한은 보조값이며 관리자 수동 확인이 필요합니다.", "critical"],
  ["verify_jurisdiction", "관할기관 확인", "제출기관과 관할기관을 관리자 검토로 확인합니다.", "warn"],
  ["verify_latest_official_form", "최신 공식 서식 확인", "기관 공식 서식과 제출 기준 최신 여부를 확인합니다.", "critical"],
  ["check_administrative_scrivener_scope", "행정사 업무범위 확인", "행정사 업무범위 내 처리 가능 여부를 확인합니다.", "critical"],
  ["check_attorney_scope_risk", "변호사 업무 가능성 표시", "법률대리 또는 소송대리 가능성이 있으면 별도 검토가 필요합니다.", "critical"],
  ["no_ai_legal_conclusion", "AI 단독 법률판단 금지", "AI 출력은 초안/정리 보조이며 법률판단을 단독 확정하지 않습니다.", "critical"],
  ["no_ai_customer_submission", "AI 단독 고객 안내 금지", "고객 안내와 기관 제출 전 관리자 승인을 요구합니다.", "critical"],
  ["admin_approval_required", "관리자 승인 필수", "문서 export 또는 고객 안내 전 관리자 승인을 요구합니다.", "critical"],
  ["sensitive_identity_data_protection", "민감 신원정보 보호", "여권번호, 외국인등록번호 등 고유식별정보는 보안 설계 전 평문 저장하지 않습니다.", "critical"],
  ["no_file_upload_before_security_design", "파일 업로드 보류", "파일 보안, 접근로그, 다운로드 로그 설계 전 고객 파일 업로드를 만들지 않습니다.", "critical"]
];

export const immigrationSafetyGuardrails = immigrationSafetyGuardrailInputs.map(([id, labelKo, descriptionKo, severity]) => ({
  id,
  labelKo,
  descriptionKo,
  severity,
  appliesToMatterTypes: immigrationMatterTypeDefinitions.map((matterType) => matterType.matterType)
})) as readonly ImmigrationSafetyGuardrail[];

export function getImmigrationMatterTypeDefinition(matterType: string) {
  return immigrationMatterTypeDefinitions.find((definition) => definition.matterType === matterType) ?? null;
}

export function listImmigrationMatterTypes() {
  return [...immigrationMatterTypeDefinitions];
}

export function listImmigrationMatterTypesByCategory(category: ImmigrationMatterCategory) {
  return immigrationMatterTypeDefinitions.filter((definition) => definition.category === category);
}

export function listImmigrationMatterTypeOptions(): ImmigrationMatterTypeOption[] {
  return immigrationMatterTypeDefinitions.map((definition) => ({
    value: definition.matterType,
    label: definition.labelKo,
    category: definition.category,
    description: definition.descriptionKo
  }));
}

export function getImmigrationMatterTypeLabel(matterType: string) {
  return getImmigrationMatterTypeDefinition(matterType)?.labelKo ?? null;
}

export function formatCaseMatterTypeLabel(matterType: string | null | undefined) {
  const normalized = matterType?.trim();
  if (!normalized) return "-";
  return getImmigrationMatterTypeLabel(normalized) ?? normalized;
}

export function getDispositionTypeDefinition(code: string) {
  return immigrationDispositionTypeDefinitions.find((definition) => definition.code === code) ?? null;
}

export function getDeadlinePriorityForMatterType(matterType: string): readonly ImmigrationDeadlineField[] {
  return getImmigrationMatterTypeDefinition(matterType)?.deadlinePriority ?? [];
}

export function getRequiredDocumentTemplatesForMatterType(matterType: string) {
  const definition = getImmigrationMatterTypeDefinition(matterType);
  if (!definition) return [];
  const ids = new Set<string>(definition.requiredDocumentTemplateIds);
  return immigrationRequiredDocumentTemplates.filter((template) => ids.has(template.id));
}

export function getDraftCandidatesForMatterType(matterType: string) {
  const definition = getImmigrationMatterTypeDefinition(matterType);
  if (!definition) return [];
  const ids = new Set<string>(definition.draftTemplateCandidateIds);
  return immigrationDraftTemplateCandidates.filter((candidate) => ids.has(candidate.id));
}

export function getSafetyGuardrailsForMatterType(matterType: string) {
  const definition = getImmigrationMatterTypeDefinition(matterType);
  if (!definition) return [];
  const ids = new Set<string>(definition.safetyGuardrailIds);
  return immigrationSafetyGuardrails.filter((guardrail) => ids.has(guardrail.id));
}

export function isImmigrationMatterType(matterType: string): matterType is ImmigrationMatterType {
  return Boolean(getImmigrationMatterTypeDefinition(matterType));
}
