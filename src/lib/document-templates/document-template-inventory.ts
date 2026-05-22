export type DocumentTemplateCategory =
  | "common"
  | "administrative_appeal"
  | "immigration"
  | "information_disclosure"
  | "driver_license"
  | "general_statement";

export type DocumentTemplateSourceFormat = "hwp" | "hwpx" | "docx" | "html" | "pdf";

export type DocumentTemplateConversionStatus =
  | "not_started"
  | "source_collected"
  | "official_verified"
  | "conversion_testing"
  | "template_candidate"
  | "verified"
  | "manual_only";

export type DocumentTemplateRiskLevel = "low" | "medium" | "high";

export type DocumentTemplateInventoryItem = {
  id: string;
  titleKo: string;
  category: DocumentTemplateCategory;
  sourceFormat: DocumentTemplateSourceFormat;
  sourceAssetStatus: "placeholder_only" | "source_needed" | "source_collected";
  canonicalFormatCandidate: Array<"hwpx" | "docx" | "html">;
  conversionStatus: DocumentTemplateConversionStatus;
  riskLevel: DocumentTemplateRiskLevel;
  requiredFields: string[];
  optionalFields: string[];
  officialSourceName: string;
  latestVerifiedAt: string | null;
  notesKo: string;
};

export const documentTemplateInventory = [
  {
    id: "common_power_of_attorney",
    titleKo: "위임장",
    category: "common",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx", "docx"],
    conversionStatus: "not_started",
    riskLevel: "medium",
    requiredFields: ["client.name", "client.address", "admin.name", "case.scope", "today"],
    optionalFields: ["client.contact", "case.referenceNo"],
    officialSourceName: "공통 위임장 원본 확인 필요",
    latestVerifiedAt: null,
    notesKo: "공통 사건 패키지의 기본 서식 후보입니다."
  },
  {
    id: "common_privacy_consent",
    titleKo: "개인정보수집동의서",
    category: "common",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx", "docx"],
    conversionStatus: "not_started",
    riskLevel: "high",
    requiredFields: ["client.name", "client.contact", "consent.scope", "today"],
    optionalFields: ["client.representativeName"],
    officialSourceName: "개인정보 수집 동의 서식 원본 확인 필요",
    latestVerifiedAt: null,
    notesKo: "민감정보 처리 전 공식 서식 최신성 확인이 필요합니다."
  },
  {
    id: "common_consultation_log",
    titleKo: "행정사상담일지",
    category: "common",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["docx", "html"],
    conversionStatus: "not_started",
    riskLevel: "medium",
    requiredFields: ["client.name", "consultationDate", "case.type", "memo"],
    optionalFields: ["client.contact", "consultation.channel"],
    officialSourceName: "사무소 내부 상담일지 서식",
    latestVerifiedAt: null,
    notesKo: "내부 기록용 후보이며 고객 발송 대상이 아닙니다."
  },
  {
    id: "common_case_processing_ledger",
    titleKo: "행정사 업무처리부",
    category: "common",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["html"],
    conversionStatus: "not_started",
    riskLevel: "medium",
    requiredFields: ["case.number", "client.name", "case.type", "acceptedAt", "closedAt", "feeStatus"],
    optionalFields: ["assignedTo", "case.note"],
    officialSourceName: "행정사 업무처리부 원본 확인 필요",
    latestVerifiedAt: null,
    notesKo: "장부/수임관리 데이터와 후속 연결할 수 있는 내부 운영 서식 후보입니다."
  },
  {
    id: "admin_appeal_petition",
    titleKo: "행정심판 청구서",
    category: "administrative_appeal",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx"],
    conversionStatus: "not_started",
    riskLevel: "high",
    requiredFields: ["client.name", "case.agency", "case.dispositionType", "case.claimPurpose"],
    optionalFields: ["case.dispositionDate", "evidenceList"],
    officialSourceName: "행정심판위원회 공식 서식 확인 필요",
    latestVerifiedAt: null,
    notesKo: "고위험 문서입니다. 업무범위와 공식 서식 확인 전 생성하지 않습니다."
  },
  {
    id: "stay_of_execution_application",
    titleKo: "집행정지 신청서",
    category: "administrative_appeal",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx"],
    conversionStatus: "not_started",
    riskLevel: "high",
    requiredFields: ["client.name", "case.agency", "case.dispositionType", "case.urgencyReason"],
    optionalFields: ["case.appealDeadline", "evidenceList"],
    officialSourceName: "행정심판 집행정지 공식 서식 확인 필요",
    latestVerifiedAt: null,
    notesKo: "긴급성과 법률 검토가 필요한 고위험 문서 후보입니다."
  },
  {
    id: "supplemental_brief",
    titleKo: "보충서면",
    category: "administrative_appeal",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx", "docx"],
    conversionStatus: "not_started",
    riskLevel: "high",
    requiredFields: ["case.title", "case.agency", "client.name", "case.argumentSummary"],
    optionalFields: ["evidenceList", "case.deadline"],
    officialSourceName: "행정심판 보충서면 서식 확인 필요",
    latestVerifiedAt: null,
    notesKo: "행정심판 패키지 후보입니다. 관리자 검토 전 사용하지 않습니다."
  },
  {
    id: "evidence_list",
    titleKo: "증거목록",
    category: "administrative_appeal",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx", "docx", "html"],
    conversionStatus: "not_started",
    riskLevel: "medium",
    requiredFields: ["evidenceList"],
    optionalFields: ["case.title", "client.name"],
    officialSourceName: "사건별 증거목록 서식",
    latestVerifiedAt: null,
    notesKo: "반복 필드와 표 구조 검증이 필요합니다."
  },
  {
    id: "submitted_materials_list",
    titleKo: "제출자료목록",
    category: "administrative_appeal",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx", "docx", "html"],
    conversionStatus: "not_started",
    riskLevel: "medium",
    requiredFields: ["submittedMaterials"],
    optionalFields: ["case.agency", "client.name"],
    officialSourceName: "제출자료목록 내부 서식",
    latestVerifiedAt: null,
    notesKo: "제출 전 자료 누락 점검용 후보입니다."
  },
  {
    id: "information_disclosure_request",
    titleKo: "정보공개청구서",
    category: "information_disclosure",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx", "docx"],
    conversionStatus: "not_started",
    riskLevel: "medium",
    requiredFields: ["client.name", "agency.name", "requestedInfo", "receiveMethod"],
    optionalFields: ["client.address"],
    officialSourceName: "정보공개포털/기관 공식 서식 확인 필요",
    latestVerifiedAt: null,
    notesKo: "공식 별지 최신성 확인 후 후보로 승격합니다."
  },
  {
    id: "information_disclosure_objection",
    titleKo: "정보공개 이의신청서",
    category: "information_disclosure",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx", "docx"],
    conversionStatus: "not_started",
    riskLevel: "high",
    requiredFields: ["client.name", "agency.name", "decisionDate", "objectionReason"],
    optionalFields: ["disclosureRequestNo"],
    officialSourceName: "정보공개 이의신청 공식 서식 확인 필요",
    latestVerifiedAt: null,
    notesKo: "불복 기한과 처분 내용 검토가 필요한 후보입니다."
  },
  {
    id: "immigration_integrated_application",
    titleKo: "통합신청서",
    category: "immigration",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx"],
    conversionStatus: "not_started",
    riskLevel: "high",
    requiredFields: ["client.name", "nationality", "stayStatus", "applicationType"],
    optionalFields: ["case.reasonSummary", "supportingFacts"],
    officialSourceName: "출입국·외국인청 공식 서식 확인 필요",
    latestVerifiedAt: null,
    notesKo: "출입국 vertical 핵심 후보입니다. 민감 식별정보는 registry에 직접 저장하지 않습니다."
  },
  {
    id: "stay_extension_application",
    titleKo: "체류기간 연장 신청서",
    category: "immigration",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx"],
    conversionStatus: "not_started",
    riskLevel: "high",
    requiredFields: ["client.name", "nationality", "stayStatus", "stayExpiryDate"],
    optionalFields: ["reasonSummary", "supportingFacts"],
    officialSourceName: "출입국·외국인청 공식 서식 확인 필요",
    latestVerifiedAt: null,
    notesKo: "체류기간과 제출기한 확인이 필요합니다."
  },
  {
    id: "status_change_application",
    titleKo: "체류자격 변경 신청서",
    category: "immigration",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx"],
    conversionStatus: "not_started",
    riskLevel: "high",
    requiredFields: ["client.name", "nationality", "currentStayStatus", "targetStayStatus"],
    optionalFields: ["reasonSummary", "employmentOrSchoolSummary"],
    officialSourceName: "출입국·외국인청 공식 서식 확인 필요",
    latestVerifiedAt: null,
    notesKo: "자격 요건 검토 없이 생성하지 않는 후보입니다."
  },
  {
    id: "refugee_status_application",
    titleKo: "난민인정신청서",
    category: "immigration",
    sourceFormat: "hwp",
    sourceAssetStatus: "source_needed",
    canonicalFormatCandidate: ["hwpx"],
    conversionStatus: "not_started",
    riskLevel: "high",
    requiredFields: ["client.name", "nationality", "entryDate", "claimSummary"],
    optionalFields: ["familyInKoreaSummary", "residenceBaseSummary"],
    officialSourceName: "출입국·외국인청 공식 서식 확인 필요",
    latestVerifiedAt: null,
    notesKo: "민감정보 보호와 관리자 검토가 필수인 고위험 후보입니다."
  }
] satisfies DocumentTemplateInventoryItem[];

export function listDocumentTemplateInventory() {
  return [...documentTemplateInventory];
}

export function getDocumentTemplateInventoryItem(id: string) {
  return documentTemplateInventory.find((item) => item.id === id) ?? null;
}

export function getHighRiskDocumentTemplates() {
  return documentTemplateInventory.filter((item) => item.riskLevel === "high");
}

export function getDocumentTemplateCategoryLabel(category: DocumentTemplateCategory) {
  const labels: Record<DocumentTemplateCategory, string> = {
    common: "공통",
    administrative_appeal: "행정심판",
    immigration: "출입국",
    information_disclosure: "정보공개",
    driver_license: "운전면허",
    general_statement: "진술·탄원"
  };
  return labels[category];
}

export function getDocumentTemplateConversionStatusLabel(status: DocumentTemplateConversionStatus) {
  const labels: Record<DocumentTemplateConversionStatus, string> = {
    not_started: "미착수",
    source_collected: "원본 확보",
    official_verified: "공식 서식 확인",
    conversion_testing: "변환 테스트",
    template_candidate: "템플릿 후보",
    verified: "검증 완료",
    manual_only: "수동 유지"
  };
  return labels[status];
}

export function getDocumentTemplateRiskLabel(riskLevel: DocumentTemplateRiskLevel) {
  const labels: Record<DocumentTemplateRiskLevel, string> = {
    low: "낮음",
    medium: "중간",
    high: "높음"
  };
  return labels[riskLevel];
}
