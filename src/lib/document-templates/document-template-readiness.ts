import type { DocumentTemplateInventoryItem } from "./document-template-inventory";

export type DocumentTemplateReadinessCheckId =
  | "source_file_collected"
  | "official_source_verified"
  | "working_copy_prepared"
  | "required_fields_mapped"
  | "optional_fields_mapped"
  | "conversion_tested"
  | "pdf_preview_checked"
  | "layout_verified"
  | "risk_reviewed"
  | "ready_for_document_lab";

export type DocumentTemplateReadinessStatus =
  | "not_started"
  | "needs_source"
  | "needs_mapping"
  | "needs_conversion_test"
  | "needs_review"
  | "ready_candidate"
  | "manual_only";

export type DocumentTemplateReadinessCheck = {
  id: DocumentTemplateReadinessCheckId;
  labelKo: string;
  descriptionKo: string;
  severity: "info" | "warning" | "critical";
  requiredForReady: boolean;
  completed: boolean;
};

export type DocumentTemplateReadiness = {
  templateId: string;
  status: DocumentTemplateReadinessStatus;
  checks: DocumentTemplateReadinessCheck[];
  completedCount: number;
  requiredCount: number;
  missingRequiredChecks: DocumentTemplateReadinessCheck[];
  warnings: string[];
};

export const documentTemplateReadinessCheckDefinitions = [
  {
    id: "source_file_collected",
    labelKo: "원본 서식 확보",
    descriptionKo: "공식 HWP/HWPX 원본 또는 검증 가능한 source asset 후보가 확보되어야 합니다.",
    severity: "critical",
    requiredForReady: true
  },
  {
    id: "official_source_verified",
    labelKo: "공식 최신성 확인",
    descriptionKo: "공식 출처와 최신 개정 여부를 확인해야 합니다.",
    severity: "critical",
    requiredForReady: true
  },
  {
    id: "working_copy_prepared",
    labelKo: "작업본 준비",
    descriptionKo: "실험용 HWPX/DOCX/HTML 작업 후보가 준비되어야 합니다.",
    severity: "warning",
    requiredForReady: true
  },
  {
    id: "required_fields_mapped",
    labelKo: "필수 입력값 매핑",
    descriptionKo: "필수 입력값이 registry field로 정의되어야 합니다.",
    severity: "critical",
    requiredForReady: true
  },
  {
    id: "optional_fields_mapped",
    labelKo: "선택 입력값 매핑",
    descriptionKo: "선택 입력값 후보가 정리되어야 합니다.",
    severity: "info",
    requiredForReady: false
  },
  {
    id: "conversion_tested",
    labelKo: "변환 테스트",
    descriptionKo: "후보 포맷 변환 테스트를 통과해야 합니다.",
    severity: "warning",
    requiredForReady: true
  },
  {
    id: "pdf_preview_checked",
    labelKo: "PDF preview 검수",
    descriptionKo: "미리보기 산출물의 누락, 줄바꿈, 배치 깨짐을 확인해야 합니다.",
    severity: "warning",
    requiredForReady: true
  },
  {
    id: "layout_verified",
    labelKo: "레이아웃 검수",
    descriptionKo: "공식 서식 구조와 표/문단 배치가 유지되는지 확인해야 합니다.",
    severity: "warning",
    requiredForReady: true
  },
  {
    id: "risk_reviewed",
    labelKo: "업무범위/위험 검토",
    descriptionKo: "고위험 서식은 업무범위와 공식 서식 검토가 필요합니다.",
    severity: "critical",
    requiredForReady: true
  },
  {
    id: "ready_for_document_lab",
    labelKo: "Document Lab 준비 후보",
    descriptionKo: "read-only preview 실험 후보로 볼 수 있는 상태입니다.",
    severity: "info",
    requiredForReady: false
  }
] satisfies Array<Omit<DocumentTemplateReadinessCheck, "completed">>;

export function getDocumentTemplateReadinessStatusLabel(status: DocumentTemplateReadinessStatus) {
  const labels: Record<DocumentTemplateReadinessStatus, string> = {
    not_started: "준비 전",
    needs_source: "원본 필요",
    needs_mapping: "필드 매핑 필요",
    needs_conversion_test: "변환 테스트 필요",
    needs_review: "검토 필요",
    ready_candidate: "준비 후보",
    manual_only: "수동 작성 유지"
  };
  return labels[status];
}

function hasSourceAsset(item: DocumentTemplateInventoryItem) {
  return item.sourceAssetStatus === "source_collected";
}

function hasWorkingCopy(item: DocumentTemplateInventoryItem) {
  return item.canonicalFormatCandidate.length > 0 && item.conversionStatus !== "not_started";
}

function hasConversionTest(item: DocumentTemplateInventoryItem) {
  return ["template_candidate", "verified"].includes(item.conversionStatus);
}

function hasPreviewAndLayoutCheck(item: DocumentTemplateInventoryItem) {
  return item.conversionStatus === "verified";
}

function isRiskReviewed(item: DocumentTemplateInventoryItem) {
  return item.riskLevel !== "high" || item.conversionStatus === "verified";
}

function isCheckCompleted(item: DocumentTemplateInventoryItem, id: DocumentTemplateReadinessCheckId) {
  switch (id) {
    case "source_file_collected":
      return hasSourceAsset(item);
    case "official_source_verified":
      return Boolean(item.latestVerifiedAt);
    case "working_copy_prepared":
      return hasWorkingCopy(item);
    case "required_fields_mapped":
      return item.requiredFields.length > 0;
    case "optional_fields_mapped":
      return item.optionalFields.length > 0;
    case "conversion_tested":
      return hasConversionTest(item);
    case "pdf_preview_checked":
    case "layout_verified":
      return hasPreviewAndLayoutCheck(item);
    case "risk_reviewed":
      return isRiskReviewed(item);
    case "ready_for_document_lab":
      return item.conversionStatus === "verified" && Boolean(item.latestVerifiedAt) && item.requiredFields.length > 0;
  }
}

function deriveStatus(
  item: DocumentTemplateInventoryItem,
  missingRequiredChecks: DocumentTemplateReadinessCheck[]
): DocumentTemplateReadinessStatus {
  if (item.conversionStatus === "manual_only") return "manual_only";
  if (!hasSourceAsset(item)) return "needs_source";
  if (item.requiredFields.length === 0) return "needs_mapping";
  if (["not_started", "source_collected", "official_verified", "conversion_testing"].includes(item.conversionStatus)) {
    return "needs_conversion_test";
  }
  if (missingRequiredChecks.some((check) => check.id === "risk_reviewed" || check.id === "official_source_verified")) {
    return "needs_review";
  }
  if (item.conversionStatus === "verified" && missingRequiredChecks.length === 0) return "ready_candidate";
  return "not_started";
}

export function buildDocumentTemplateReadiness(item: DocumentTemplateInventoryItem): DocumentTemplateReadiness {
  const checks = documentTemplateReadinessCheckDefinitions.map((definition) => ({
    ...definition,
    completed: isCheckCompleted(item, definition.id)
  }));
  const missingRequiredChecks = checks.filter((check) => check.requiredForReady && !check.completed);
  const warnings: string[] = [];

  if (item.riskLevel === "high") {
    warnings.push("업무범위/공식서식 검토 필요");
  }
  if (!item.latestVerifiedAt) {
    warnings.push("공식 최신성 확인 필요");
  }

  return {
    templateId: item.id,
    status: deriveStatus(item, missingRequiredChecks),
    checks,
    completedCount: checks.filter((check) => check.requiredForReady && check.completed).length,
    requiredCount: checks.filter((check) => check.requiredForReady).length,
    missingRequiredChecks,
    warnings
  };
}

export function buildDocumentTemplateReadinessSummary(items: DocumentTemplateInventoryItem[]) {
  const readinessList = items.map(buildDocumentTemplateReadiness);

  return {
    totalTemplates: readinessList.length,
    readyCandidateCount: readinessList.filter((readiness) => readiness.status === "ready_candidate").length,
    sourceNeededCount: readinessList.filter((readiness) => readiness.status === "needs_source").length,
    conversionTestNeededCount: readinessList.filter((readiness) => readiness.status === "needs_conversion_test").length,
    manualOnlyCount: readinessList.filter((readiness) => readiness.status === "manual_only").length
  };
}
