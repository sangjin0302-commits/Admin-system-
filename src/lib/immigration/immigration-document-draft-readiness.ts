import {
  buildImmigrationDocumentDraftReadiness,
  getDocumentDraftTemplatesForMatterType,
  type ImmigrationDocumentDraftReadiness
} from "@/lib/immigration/immigration-document-draft-registry";

type FieldValue = string | Date | boolean | number | null | undefined;

export type ImmigrationDocumentDraftCaseData = {
  caseMatter?: {
    caseNo?: FieldValue;
    title?: FieldValue;
    summary?: FieldValue;
    dueDate?: FieldValue;
  } | null;
  immigrationDetail?: {
    dispositionType?: FieldValue;
    dispositionDate?: FieldValue;
    noticeDate?: FieldValue;
    serviceDate?: FieldValue;
    appealDeadline?: FieldValue;
    departureDeadline?: FieldValue;
    detentionStartDate?: FieldValue;
    stayExpiryDate?: FieldValue;
    submissionDeadline?: FieldValue;
    supplementDeadline?: FieldValue;
    resultExpectedDate?: FieldValue;
    nationality?: FieldValue;
    currentStayStatus?: FieldValue;
    familyInKoreaSummary?: FieldValue;
    residenceBaseSummary?: FieldValue;
    employmentOrSchoolSummary?: FieldValue;
    violationHistorySummary?: FieldValue;
    scopeReviewRequired?: boolean | null;
    attorneyScopeRisk?: boolean | null;
    officialFormCheckRequired?: boolean | null;
  } | null;
  requiredDocuments?: readonly unknown[] | null;
  caseParties?: readonly {
    role?: string | null;
    name?: string | null;
  }[] | null;
  caseEvents?: readonly {
    eventType?: string | null;
    message?: string | null;
  }[] | null;
};

export type ImmigrationDocumentDraftCaseReadiness = ImmigrationDocumentDraftReadiness & {
  availableInputFieldIds: string[];
};

function hasValue(value: FieldValue) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

function addIfAvailable(fields: Set<string>, fieldId: string, value: FieldValue) {
  if (hasValue(value)) fields.add(fieldId);
}

function buildCaseReadinessWarnings(
  readiness: ImmigrationDocumentDraftReadiness,
  detail: ImmigrationDocumentDraftCaseData["immigrationDetail"]
) {
  const warnings: string[] = [];
  if (readiness.status === "ready") {
    warnings.push("메타데이터 준비 상태입니다. 문서 본문은 생성하지 않습니다.");
    warnings.push("고객 발송 또는 기관 제출 기능은 실행하지 않습니다.");
  }
  if (detail?.attorneyScopeRisk) {
    warnings.push("변호사 업무범위 위험 표시가 있습니다. 초안 preview 전 검토하세요.");
  }
  return warnings.length > 0 ? warnings : readiness.warnings;
}

export function buildImmigrationDocumentDraftAvailableInputFieldIds(
  caseData: ImmigrationDocumentDraftCaseData
) {
  const fields = new Set<string>();
  const caseMatter = caseData.caseMatter;
  const detail = caseData.immigrationDetail;

  if (caseMatter) {
    addIfAvailable(fields, "caseMatter.caseNo", caseMatter.caseNo);
    addIfAvailable(fields, "caseMatter.title", caseMatter.title);
    addIfAvailable(fields, "caseMatter.summary", caseMatter.summary);
    addIfAvailable(fields, "caseMatter.dueDate", caseMatter.dueDate);
  }

  if (detail) {
    addIfAvailable(fields, "immigrationDetail.dispositionType", detail.dispositionType);
    addIfAvailable(fields, "immigrationDetail.dispositionDate", detail.dispositionDate);
    addIfAvailable(fields, "immigrationDetail.noticeDate", detail.noticeDate);
    addIfAvailable(fields, "immigrationDetail.serviceDate", detail.serviceDate);
    addIfAvailable(fields, "immigrationDetail.appealDeadline", detail.appealDeadline);
    addIfAvailable(fields, "immigrationDetail.departureDeadline", detail.departureDeadline);
    addIfAvailable(fields, "immigrationDetail.detentionStartDate", detail.detentionStartDate);
    addIfAvailable(fields, "immigrationDetail.stayExpiryDate", detail.stayExpiryDate);
    addIfAvailable(fields, "immigrationDetail.submissionDeadline", detail.submissionDeadline);
    addIfAvailable(fields, "immigrationDetail.nationality", detail.nationality);
    addIfAvailable(fields, "immigrationDetail.currentStayStatus", detail.currentStayStatus);
    addIfAvailable(fields, "immigrationDetail.familyInKoreaSummary", detail.familyInKoreaSummary);
    addIfAvailable(fields, "immigrationDetail.residenceBaseSummary", detail.residenceBaseSummary);
    addIfAvailable(fields, "immigrationDetail.employmentOrSchoolSummary", detail.employmentOrSchoolSummary);
    addIfAvailable(fields, "immigrationDetail.violationHistorySummary", detail.violationHistorySummary);
    fields.add("immigrationDetail.scopeReviewRequired");
    fields.add("immigrationDetail.attorneyScopeRisk");
    fields.add("immigrationDetail.officialFormCheckRequired");
  }

  if ((caseData.requiredDocuments?.length ?? 0) > 0) {
    fields.add("requiredDocuments.evidenceList");
  }

  if (caseData.caseParties?.some((party) => party.role === "CLIENT" && hasValue(party.name))) {
    fields.add("caseParties.clientName");
  }

  if (
    caseData.caseEvents?.some((event) => {
      const eventType = event.eventType ?? "";
      const message = event.message ?? "";
      return eventType.includes("DEADLINE") || eventType.includes("IMMIGRATION_CASE_DETAIL") || /deadline|기한/u.test(message);
    })
  ) {
    fields.add("caseEvents.latestDeadlineVerification");
  }

  return [...fields].sort();
}

export function buildImmigrationDocumentDraftReadinessForCase(
  templateId: string,
  caseData: ImmigrationDocumentDraftCaseData
): ImmigrationDocumentDraftCaseReadiness {
  const availableInputFieldIds = buildImmigrationDocumentDraftAvailableInputFieldIds(caseData);
  const detail = caseData.immigrationDetail;
  const readiness = buildImmigrationDocumentDraftReadiness({
    templateId,
    availableInputFieldIds,
    scopeReviewed: detail?.scopeReviewRequired === false,
    officialFormChecked: detail?.officialFormCheckRequired === false,
    adminApproved: false
  });

  return {
    ...readiness,
    availableInputFieldIds,
    warnings: buildCaseReadinessWarnings(readiness, detail)
  };
}

export function buildImmigrationDocumentDraftReadinessListForCase(
  matterType: string,
  caseData: ImmigrationDocumentDraftCaseData
) {
  return getDocumentDraftTemplatesForMatterType(matterType).map((template) =>
    buildImmigrationDocumentDraftReadinessForCase(template.id, caseData)
  );
}
