import type { BridgeWorkflowPersistence, SourceVerificationTaskInput } from "../lawbot-bridge-workflow-mapping-service";

import type {
  JsonObject,
  WorkflowCaseRecord,
  WorkflowInquiryRecord
} from "./types";

export function parseJsonObject(raw: string | null | undefined) {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }
    return parsed as JsonObject;
  } catch {
    return undefined;
  }
}

export function parseStringArray(raw: string | null | undefined) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => String(entry ?? "").trim())
      .filter((entry) => entry.length > 0);
  } catch {
    return [];
  }
}

export function parseSubtypeKeysFromObjects(input: {
  practitionerGuide: JsonObject | null;
  caseOutlook: JsonObject | null;
}) {
  const subtypeFromGuide = Array.isArray(input.practitionerGuide?.matched_subtype_keys)
    ? input.practitionerGuide?.matched_subtype_keys
    : [];
  const subtypeFromOutlook = Array.isArray(input.caseOutlook?.matched_subtype_keys)
    ? input.caseOutlook?.matched_subtype_keys
    : [];

  return [...new Set(
    [...subtypeFromGuide, ...subtypeFromOutlook]
      .map((entry) => String(entry ?? "").trim())
      .filter((entry) => entry.length > 0)
  )];
}

export function buildFactInput(inquiry: WorkflowInquiryRecord) {
  return [
    `Case title: ${inquiry.title}`,
    `Client: ${inquiry.contactName}`,
    inquiry.nationality ? `Nationality: ${inquiry.nationality}` : null,
    inquiry.currentStatus ? `Current status: ${inquiry.currentStatus}` : null,
    inquiry.targetAgency ? `Agency: ${inquiry.targetAgency}` : null,
    inquiry.requestedOutcome ? `Requested outcome: ${inquiry.requestedOutcome}` : null,
    `Inquiry details: ${inquiry.description}`,
    inquiry.generatedSummary ? `Existing summary: ${inquiry.generatedSummary}` : null,
    inquiry.classificationReason ? `Classification reason: ${inquiry.classificationReason}` : null,
    inquiry.recommendedNextStep ? `Recommended next step: ${inquiry.recommendedNextStep}` : null
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n");
}

export function buildCaseProfile(
  inquiry: WorkflowInquiryRecord,
  caseRecord?: WorkflowCaseRecord | null
) {
  return {
    inquiry_id: inquiry.id,
    case_id: caseRecord?.id,
    case_number: caseRecord?.caseNumber,
    workflow_status: caseRecord?.bridgeWorkflowStatus ?? inquiry.bridgeWorkflowStatus ?? "NEW_INQUIRY",
    review_required: caseRecord?.bridgeReviewRequired ?? inquiry.bridgeReviewRequired ?? false,
    must_verify: parseStringArray(caseRecord?.bridgeMustVerify ?? inquiry.bridgeMustVerify),
    must_verify_sources: parseStringArray(
      caseRecord?.bridgeMustVerifySources ?? inquiry.bridgeMustVerifySources
    ),
    risk_flags: parseStringArray(caseRecord?.bridgeRiskFlags ?? inquiry.bridgeRiskFlags),
    practitioner_guide:
      parseJsonObject(caseRecord?.bridgePractitionerGuide ?? inquiry.bridgePractitionerGuide) ?? null,
    case_outlook:
      parseJsonObject(caseRecord?.bridgeCaseOutlook ?? inquiry.bridgeCaseOutlook) ?? null
  };
}

export function applyWorkflowToInquiryRecord(
  inquiry: WorkflowInquiryRecord,
  workflow: BridgeWorkflowPersistence
): WorkflowInquiryRecord {
  return {
    ...inquiry,
    bridgeWorkflowStatus: workflow.bridgeWorkflowStatus,
    bridgeReviewRequired: workflow.bridgeReviewRequired,
    bridgeMustVerify: workflow.bridgeMustVerify,
    bridgeMustVerifySources: workflow.bridgeMustVerifySources,
    bridgeRiskFlags: workflow.bridgeRiskFlags,
    bridgePractitionerGuide: workflow.bridgePractitionerGuide,
    bridgeCaseOutlook: workflow.bridgeCaseOutlook
  };
}

export function applyWorkflowToCaseRecord(
  caseRecord: WorkflowCaseRecord,
  workflow: BridgeWorkflowPersistence
): WorkflowCaseRecord {
  return {
    ...caseRecord,
    bridgeWorkflowStatus: workflow.bridgeWorkflowStatus,
    bridgeReviewRequired: workflow.bridgeReviewRequired,
    bridgeMustVerify: workflow.bridgeMustVerify,
    bridgeMustVerifySources: workflow.bridgeMustVerifySources,
    bridgeRiskFlags: workflow.bridgeRiskFlags,
    bridgePractitionerGuide: workflow.bridgePractitionerGuide,
    bridgeCaseOutlook: workflow.bridgeCaseOutlook
  };
}

export function withCaseId<T extends { caseId?: string }>(items: T[], caseId: string) {
  return items.map((item) => ({
    ...item,
    caseId
  }));
}

export function withoutCaseId<T extends { caseId?: string }>(items: T[]) {
  return items.map((item) => ({
    ...item,
    caseId: undefined
  }));
}

export function withDocumentDraftId(
  items: SourceVerificationTaskInput[],
  caseId: string,
  documentDraftId: string
) {
  return items.map((item) => ({
    ...item,
    caseId,
    documentDraftId
  }));
}

export function withMessageDraftId(
  items: SourceVerificationTaskInput[],
  caseId: string,
  messageDraftId: string
) {
  return items.map((item) => ({
    ...item,
    caseId,
    messageDraftId
  }));
}

export function parseJsonObjectOrNull(raw: string | null | undefined): JsonObject | null {
  return parseJsonObject(raw) ?? null;
}

export function isWorkflowLockedForRerun(status: string | null | undefined) {
  return status === "APPROVAL_PENDING" || status === "APPROVED";
}
