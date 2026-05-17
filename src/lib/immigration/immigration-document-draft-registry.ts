import { type ImmigrationMatterType, isImmigrationMatterType } from "@/lib/immigration/immigration-appeal-registry";

export const immigrationDocumentDraftTemplateIds = [
  "fact_summary",
  "submitted_evidence_list",
  "evidence_index",
  "explanation_statement",
  "personal_statement",
  "petition",
  "mitigation_statement",
  "administrative_appeal_petition_draft",
  "stay_of_execution_application_draft",
  "stay_extension_or_change_reason_statement"
] as const;

export type ImmigrationDocumentDraftTemplateId = (typeof immigrationDocumentDraftTemplateIds)[number];
export type ImmigrationDocumentDraftRiskLevel = "low" | "medium" | "high";
export type ImmigrationDocumentDraftInputSourceGroup =
  | "caseMatter"
  | "immigrationDetail"
  | "requiredDocuments"
  | "caseParties"
  | "caseEvents";
export type ImmigrationDocumentDraftReadinessStatus =
  | "ready"
  | "missing_required_inputs"
  | "blocked_by_scope_review"
  | "blocked_by_official_form_check";

export type ImmigrationDocumentDraftInputField = {
  id: string;
  labelKo: string;
  sourceGroup: ImmigrationDocumentDraftInputSourceGroup;
};

export type ImmigrationDocumentDraftTemplate = {
  id: ImmigrationDocumentDraftTemplateId;
  labelKo: string;
  descriptionKo: string;
  category: "facts" | "evidence" | "statement" | "petition";
  riskLevel: ImmigrationDocumentDraftRiskLevel;
  adminOnlyPreview: true;
  requiresScopeReview: boolean;
  requiresOfficialFormCheck: boolean;
  noAutomaticSubmission: true;
  recommendedMatterTypes: readonly ImmigrationMatterType[];
  requiredInputFields: readonly string[];
  optionalInputFields: readonly string[];
  requiredDocumentTemplateIds: readonly string[];
  safetyGuardrailIds: readonly string[];
};

export type ImmigrationDocumentDraftReadinessInput = {
  templateId: string;
  availableInputFieldIds: readonly string[];
  scopeReviewed?: boolean;
  officialFormChecked?: boolean;
  adminApproved?: boolean;
};

export type ImmigrationDocumentDraftReadiness = {
  templateId: string;
  status: ImmigrationDocumentDraftReadinessStatus | "unknown_template";
  missingRequiredFields: ImmigrationDocumentDraftInputField[];
  requiredSafetyChecks: readonly string[];
  canPreviewDraft: boolean;
  canExport: false;
  warnings: string[];
};

export const IMMIGRATION_DOCUMENT_DRAFT_INPUT_FIELDS = [
  { id: "caseMatter.caseNo", labelKo: "사건번호", sourceGroup: "caseMatter" },
  { id: "caseMatter.title", labelKo: "사건명", sourceGroup: "caseMatter" },
  { id: "caseMatter.summary", labelKo: "사건 요약", sourceGroup: "caseMatter" },
  { id: "caseMatter.dueDate", labelKo: "사건 대표 기한", sourceGroup: "caseMatter" },
  { id: "immigrationDetail.dispositionType", labelKo: "처분 유형", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.dispositionDate", labelKo: "처분일", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.noticeDate", labelKo: "통지일", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.serviceDate", labelKo: "송달일", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.appealDeadline", labelKo: "불복/신청 기한", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.departureDeadline", labelKo: "출국기한", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.detentionStartDate", labelKo: "보호 개시일", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.stayExpiryDate", labelKo: "체류기간 만료일", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.submissionDeadline", labelKo: "제출기한", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.nationality", labelKo: "국적", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.currentStayStatus", labelKo: "현재 체류 상태", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.familyInKoreaSummary", labelKo: "국내 가족관계 요약", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.residenceBaseSummary", labelKo: "국내 생활기반 요약", sourceGroup: "immigrationDetail" },
  {
    id: "immigrationDetail.employmentOrSchoolSummary",
    labelKo: "고용/사업/학업 요약",
    sourceGroup: "immigrationDetail"
  },
  { id: "immigrationDetail.violationHistorySummary", labelKo: "위반 이력 요약", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.scopeReviewRequired", labelKo: "업무범위 검토 필요", sourceGroup: "immigrationDetail" },
  { id: "immigrationDetail.attorneyScopeRisk", labelKo: "변호사 업무 위험", sourceGroup: "immigrationDetail" },
  {
    id: "immigrationDetail.officialFormCheckRequired",
    labelKo: "공식 서식 확인 필요",
    sourceGroup: "immigrationDetail"
  },
  { id: "requiredDocuments.evidenceList", labelKo: "제출/증빙 자료 목록", sourceGroup: "requiredDocuments" },
  { id: "caseParties.clientName", labelKo: "의뢰인 이름", sourceGroup: "caseParties" },
  { id: "caseEvents.latestDeadlineVerification", labelKo: "최근 기한 확인 이력", sourceGroup: "caseEvents" }
] as const satisfies readonly ImmigrationDocumentDraftInputField[];

const COMMON_FACT_FIELDS = [
  "caseMatter.caseNo",
  "caseMatter.title",
  "immigrationDetail.dispositionType",
  "immigrationDetail.currentStayStatus"
] as const;

const COMMON_DEADLINE_FIELDS = [
  "immigrationDetail.serviceDate",
  "immigrationDetail.appealDeadline",
  "caseMatter.dueDate"
] as const;

const COMMON_LIFE_BASE_FIELDS = [
  "immigrationDetail.nationality",
  "immigrationDetail.familyInKoreaSummary",
  "immigrationDetail.residenceBaseSummary",
  "immigrationDetail.employmentOrSchoolSummary",
  "immigrationDetail.violationHistorySummary"
] as const;

const APPEAL_MATTER_TYPES = [
  "deportation_order_appeal",
  "departure_order_appeal",
  "entry_ban_response",
  "stay_extension_denial_appeal",
  "status_change_denial_appeal",
  "detention_or_protection_review",
  "refugee_or_humanitarian_status"
] as const satisfies readonly ImmigrationMatterType[];

const STAY_MATTER_TYPES = [
  "stay_extension_denial_appeal",
  "status_change_denial_appeal",
  "residence_status_document_support"
] as const satisfies readonly ImmigrationMatterType[];

const DOCUMENT_SUPPORT_MATTER_TYPES = [
  "visa_issuance_support",
  "residence_status_document_support",
  "general_immigration_statement"
] as const satisfies readonly ImmigrationMatterType[];

const COMMON_GUARDRAILS = [
  "verify_original_disposition_document",
  "verify_service_date",
  "verify_deadline_manually",
  "check_administrative_scrivener_scope",
  "no_ai_legal_conclusion",
  "no_ai_customer_submission",
  "admin_approval_required"
] as const;

export const IMMIGRATION_DOCUMENT_DRAFT_TEMPLATES = [
  {
    id: "fact_summary",
    labelKo: "사실관계 정리 초안",
    descriptionKo: "처분 경위, 체류 이력, 주요 기한을 관리자 검토용으로 정리하는 메타데이터 초안 후보입니다.",
    category: "facts",
    riskLevel: "low",
    adminOnlyPreview: true,
    requiresScopeReview: false,
    requiresOfficialFormCheck: false,
    noAutomaticSubmission: true,
    recommendedMatterTypes: [...APPEAL_MATTER_TYPES, ...DOCUMENT_SUPPORT_MATTER_TYPES],
    requiredInputFields: COMMON_FACT_FIELDS,
    optionalInputFields: [...COMMON_DEADLINE_FIELDS, ...COMMON_LIFE_BASE_FIELDS],
    requiredDocumentTemplateIds: ["immigration_history", "statement"],
    safetyGuardrailIds: COMMON_GUARDRAILS
  },
  {
    id: "submitted_evidence_list",
    labelKo: "제출자료 목록 초안",
    descriptionKo: "RequiredDocument 상태를 바탕으로 제출자료 목록을 정리하기 위한 관리자 전용 후보입니다.",
    category: "evidence",
    riskLevel: "low",
    adminOnlyPreview: true,
    requiresScopeReview: false,
    requiresOfficialFormCheck: false,
    noAutomaticSubmission: true,
    recommendedMatterTypes: [...APPEAL_MATTER_TYPES, ...DOCUMENT_SUPPORT_MATTER_TYPES],
    requiredInputFields: ["caseMatter.caseNo", "caseMatter.title", "requiredDocuments.evidenceList"],
    optionalInputFields: ["immigrationDetail.dispositionType", "caseParties.clientName"],
    requiredDocumentTemplateIds: ["evidence_index"],
    safetyGuardrailIds: ["admin_approval_required", "no_ai_customer_submission"]
  },
  {
    id: "evidence_index",
    labelKo: "증거목록 초안",
    descriptionKo: "증거번호, 자료명, 입증취지를 정리하기 위한 관리자 전용 후보입니다.",
    category: "evidence",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: false,
    requiresOfficialFormCheck: false,
    noAutomaticSubmission: true,
    recommendedMatterTypes: APPEAL_MATTER_TYPES,
    requiredInputFields: ["caseMatter.caseNo", "caseMatter.title", "requiredDocuments.evidenceList"],
    optionalInputFields: COMMON_LIFE_BASE_FIELDS,
    requiredDocumentTemplateIds: ["evidence_index"],
    safetyGuardrailIds: COMMON_GUARDRAILS
  },
  {
    id: "explanation_statement",
    labelKo: "사유서/소명서 초안",
    descriptionKo: "체류 목적, 처분 경위, 보완 사유를 정리하기 위한 관리자 전용 후보입니다.",
    category: "statement",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: false,
    noAutomaticSubmission: true,
    recommendedMatterTypes: [...APPEAL_MATTER_TYPES, ...DOCUMENT_SUPPORT_MATTER_TYPES],
    requiredInputFields: [...COMMON_FACT_FIELDS, "immigrationDetail.nationality", "immigrationDetail.residenceBaseSummary"],
    optionalInputFields: [...COMMON_DEADLINE_FIELDS, "requiredDocuments.evidenceList"],
    requiredDocumentTemplateIds: ["statement"],
    safetyGuardrailIds: COMMON_GUARDRAILS
  },
  {
    id: "personal_statement",
    labelKo: "진술서 초안",
    descriptionKo: "본인 사정과 사실관계를 정리하기 위한 관리자 전용 후보입니다.",
    category: "statement",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: false,
    noAutomaticSubmission: true,
    recommendedMatterTypes: APPEAL_MATTER_TYPES,
    requiredInputFields: [...COMMON_FACT_FIELDS, "caseParties.clientName"],
    optionalInputFields: COMMON_LIFE_BASE_FIELDS,
    requiredDocumentTemplateIds: ["personal_statement", "statement"],
    safetyGuardrailIds: COMMON_GUARDRAILS
  },
  {
    id: "petition",
    labelKo: "진정서/탄원서 초안",
    descriptionKo: "관계자 진정 또는 탄원 취지를 정리하기 위한 관리자 전용 후보입니다.",
    category: "petition",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: false,
    noAutomaticSubmission: true,
    recommendedMatterTypes: APPEAL_MATTER_TYPES,
    requiredInputFields: ["caseMatter.caseNo", "caseMatter.title", "caseParties.clientName"],
    optionalInputFields: [...COMMON_LIFE_BASE_FIELDS, "requiredDocuments.evidenceList"],
    requiredDocumentTemplateIds: ["petition"],
    safetyGuardrailIds: COMMON_GUARDRAILS
  },
  {
    id: "mitigation_statement",
    labelKo: "정상참작 사유서 초안",
    descriptionKo: "가족, 직장, 학업, 건강 등 정상참작 사유를 정리하기 위한 관리자 전용 후보입니다.",
    category: "statement",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: false,
    noAutomaticSubmission: true,
    recommendedMatterTypes: [
      "deportation_order_appeal",
      "departure_order_appeal",
      "overstay_penalty_response",
      "immigration_offense_review"
    ],
    requiredInputFields: ["caseMatter.caseNo", "caseMatter.title", "immigrationDetail.violationHistorySummary"],
    optionalInputFields: COMMON_LIFE_BASE_FIELDS,
    requiredDocumentTemplateIds: ["mitigation_evidence", "reflection_or_explanation_letter"],
    safetyGuardrailIds: COMMON_GUARDRAILS
  },
  {
    id: "administrative_appeal_petition_draft",
    labelKo: "행정심판 청구서 초안",
    descriptionKo: "행정심판 청구서 공식 서식 검토 전 관리자 전용 메타데이터 후보입니다.",
    category: "petition",
    riskLevel: "high",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: true,
    noAutomaticSubmission: true,
    recommendedMatterTypes: APPEAL_MATTER_TYPES,
    requiredInputFields: [
      ...COMMON_FACT_FIELDS,
      "immigrationDetail.serviceDate",
      "immigrationDetail.appealDeadline",
      "caseParties.clientName",
      "requiredDocuments.evidenceList"
    ],
    optionalInputFields: [...COMMON_LIFE_BASE_FIELDS, "caseEvents.latestDeadlineVerification"],
    requiredDocumentTemplateIds: ["administrative_appeal_draft_material", "service_date_evidence"],
    safetyGuardrailIds: [...COMMON_GUARDRAILS, "verify_latest_official_form"]
  },
  {
    id: "stay_of_execution_application_draft",
    labelKo: "집행정지 신청서 초안",
    descriptionKo: "집행정지 신청 가능성 검토 전 관리자 전용 메타데이터 후보입니다.",
    category: "petition",
    riskLevel: "high",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: true,
    noAutomaticSubmission: true,
    recommendedMatterTypes: [
      "deportation_order_appeal",
      "departure_order_appeal",
      "detention_or_protection_review"
    ],
    requiredInputFields: [
      ...COMMON_FACT_FIELDS,
      "immigrationDetail.serviceDate",
      "immigrationDetail.appealDeadline",
      "requiredDocuments.evidenceList"
    ],
    optionalInputFields: ["immigrationDetail.departureDeadline", "immigrationDetail.detentionStartDate"],
    requiredDocumentTemplateIds: ["stay_of_execution_review_material", "service_date_evidence"],
    safetyGuardrailIds: [...COMMON_GUARDRAILS, "verify_latest_official_form"]
  },
  {
    id: "stay_extension_or_change_reason_statement",
    labelKo: "체류자격 변경/연장 사유서 초안",
    descriptionKo: "체류자격 변경 또는 연장 사유를 정리하기 위한 관리자 전용 후보입니다.",
    category: "statement",
    riskLevel: "medium",
    adminOnlyPreview: true,
    requiresScopeReview: true,
    requiresOfficialFormCheck: true,
    noAutomaticSubmission: true,
    recommendedMatterTypes: STAY_MATTER_TYPES,
    requiredInputFields: [
      "caseMatter.caseNo",
      "caseMatter.title",
      "immigrationDetail.currentStayStatus",
      "immigrationDetail.stayExpiryDate",
      "immigrationDetail.residenceBaseSummary"
    ],
    optionalInputFields: [
      "immigrationDetail.submissionDeadline",
      "immigrationDetail.employmentOrSchoolSummary",
      "requiredDocuments.evidenceList"
    ],
    requiredDocumentTemplateIds: ["current_stay_status_evidence", "stay_expiry_evidence"],
    safetyGuardrailIds: COMMON_GUARDRAILS
  }
] as const satisfies readonly ImmigrationDocumentDraftTemplate[];

const templateById = new Map<string, ImmigrationDocumentDraftTemplate>(
  IMMIGRATION_DOCUMENT_DRAFT_TEMPLATES.map((template) => [template.id, template])
);

const inputFieldById = new Map<string, ImmigrationDocumentDraftInputField>(
  IMMIGRATION_DOCUMENT_DRAFT_INPUT_FIELDS.map((field) => [field.id, field])
);

const templateIdSet = new Set<string>(immigrationDocumentDraftTemplateIds);

export function isImmigrationDocumentDraftTemplate(id: string): id is ImmigrationDocumentDraftTemplateId {
  return templateIdSet.has(id);
}

export function listImmigrationDocumentDraftTemplates() {
  return [...IMMIGRATION_DOCUMENT_DRAFT_TEMPLATES];
}

export function getImmigrationDocumentDraftTemplate(id: string) {
  return templateById.get(id) ?? null;
}

export function getDocumentDraftTemplatesForMatterType(matterType: string) {
  if (!isImmigrationMatterType(matterType)) return [];
  return IMMIGRATION_DOCUMENT_DRAFT_TEMPLATES.filter((template) =>
    (template.recommendedMatterTypes as readonly string[]).includes(matterType)
  );
}

export function getHighRiskImmigrationDocumentDraftTemplates() {
  return IMMIGRATION_DOCUMENT_DRAFT_TEMPLATES.filter((template) => template.riskLevel === "high");
}

export function getRequiredInputFieldsForDraft(id: string) {
  const template = getImmigrationDocumentDraftTemplate(id);
  if (!template) return [];
  return template.requiredInputFields
    .map((fieldId) => inputFieldById.get(fieldId))
    .filter((field): field is ImmigrationDocumentDraftInputField => Boolean(field));
}

export function getMissingInputFieldsForDraft(id: string, availableInputFieldIds: readonly string[]) {
  const available = new Set(availableInputFieldIds);
  return getRequiredInputFieldsForDraft(id).filter((field) => !available.has(field.id));
}

export function buildImmigrationDocumentDraftReadiness(
  input: ImmigrationDocumentDraftReadinessInput
): ImmigrationDocumentDraftReadiness {
  const template = getImmigrationDocumentDraftTemplate(input.templateId);
  if (!template) {
    return {
      templateId: input.templateId,
      status: "unknown_template",
      missingRequiredFields: [],
      requiredSafetyChecks: [],
      canPreviewDraft: false,
      canExport: false,
      warnings: ["Unknown immigration document draft template."]
    };
  }

  const missingRequiredFields = getMissingInputFieldsForDraft(template.id, input.availableInputFieldIds);
  const requiredSafetyChecks = [
    ...(template.requiresScopeReview ? ["scopeReviewed"] : []),
    ...(template.requiresOfficialFormCheck ? ["officialFormChecked"] : []),
    "adminApproved"
  ];

  if (missingRequiredFields.length > 0) {
    return {
      templateId: template.id,
      status: "missing_required_inputs",
      missingRequiredFields,
      requiredSafetyChecks,
      canPreviewDraft: false,
      canExport: false,
      warnings: ["Required input fields are missing."]
    };
  }

  if (template.requiresScopeReview && !input.scopeReviewed) {
    return {
      templateId: template.id,
      status: "blocked_by_scope_review",
      missingRequiredFields,
      requiredSafetyChecks,
      canPreviewDraft: false,
      canExport: false,
      warnings: ["Scope review is required before draft preview readiness."]
    };
  }

  if (template.requiresOfficialFormCheck && !input.officialFormChecked) {
    return {
      templateId: template.id,
      status: "blocked_by_official_form_check",
      missingRequiredFields,
      requiredSafetyChecks,
      canPreviewDraft: false,
      canExport: false,
      warnings: ["Official form check is required before draft preview readiness."]
    };
  }

  return {
    templateId: template.id,
    status: "ready",
    missingRequiredFields,
    requiredSafetyChecks,
    canPreviewDraft: Boolean(input.adminApproved),
    canExport: false,
    warnings: [
      "Metadata readiness only. This does not generate a document.",
      "No customer send, agency submission, or export is implemented."
    ]
  };
}
