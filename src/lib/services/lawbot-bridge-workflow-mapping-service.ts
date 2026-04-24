import type {
  BridgeWorkflowStatus,
  WorkflowDraftStatus
} from "../../types/lawbot-bridge-workflow.ts";
import {
  buildBridgeReviewViewModels,
  type SupplementalReferenceCandidate
} from "./lawbot-bridge-review-view-models.ts";

type JsonObject = Record<string, unknown>;

type BridgeCaseOutlook = {
  key_decision_factors?: string[];
  missing_case_facts?: string[];
} & JsonObject;

type BridgeDomainPack = {
  required_documents?: string[];
  review_checkpoints?: string[];
} & JsonObject;

type BridgeBaseResponse = {
  review_required?: boolean;
  must_verify?: string[];
  must_verify_sources?: string[];
  risk_flags?: string[];
  matched_subtype_keys?: string[];
  supplemental_reference_candidates?: unknown[];
  practitioner_guide?: JsonObject | null;
  case_outlook?: BridgeCaseOutlook | null;
  draft?: JsonObject | null;
};

export type BridgeIntakeAnalyzeResponse = BridgeBaseResponse & {
  domain?: JsonObject | null;
  scope?: JsonObject | null;
  policy?: JsonObject | null;
  intake_summary?: JsonObject | null;
};

export type BridgeIntakeProfileResponse = BridgeBaseResponse & {
  scope?: JsonObject | null;
  policy_decision?: JsonObject | null;
  evidence_profile?: JsonObject | null;
  domain_pack?: BridgeDomainPack | null;
};

export type BridgeDocumentDraftResponse = BridgeBaseResponse & {
  draft_type?: string | null;
  traceability?: JsonObject | null;
};

export type BridgeCustomerMessageDraftResponse = BridgeBaseResponse & {
  message_kind?: string | null;
};

export type MappingContext = {
  inquiryId: string;
  caseId?: string;
};

export type BridgeWorkflowPersistence = {
  bridgeWorkflowStatus: BridgeWorkflowStatus;
  bridgeReviewRequired: boolean;
  bridgeMustVerify: string;
  bridgeMustVerifySources: string;
  bridgeRiskFlags: string;
  bridgePractitionerGuide: string | null;
  bridgeCaseOutlook: string | null;
};

export type CaseTaskInput = {
  inquiryId: string;
  caseId?: string;
  title: string;
  details?: string;
  taskType: string;
  status: "OPEN";
  reviewRequired: boolean;
  mustVerify: string;
  riskFlags: string;
  source: "lawbot_bridge";
};

export type SourceVerificationTaskInput = {
  inquiryId: string;
  caseId?: string;
  title: string;
  authorityBucket?: string;
  sourceLabel: string;
  sourceCitation?: string;
  notes?: string;
  status: "OPEN";
  reviewRequired: true;
  mustVerify: string;
  riskFlags: string;
  source: "lawbot_bridge";
};

export type DocumentRequestTaskInput = {
  inquiryId: string;
  caseId?: string;
  title: string;
  documentLabel: string;
  notes?: string;
  status: "OPEN";
  reviewRequired: false;
  mustVerify: string;
  riskFlags: string;
  source: "lawbot_bridge";
};

export type DocumentDraftInput = {
  inquiryId: string;
  caseId?: string;
  draftType: string;
  title?: string;
  bodyJson: string;
  status: WorkflowDraftStatus;
  reviewRequired: boolean;
  mustVerify: string;
  mustVerifySources: string;
  riskFlags: string;
  practitionerGuide: string | null;
  caseOutlook: string | null;
  source: "lawbot_bridge";
};

export type MessageDraftInput = {
  inquiryId: string;
  caseId?: string;
  messageKind: string;
  subject: string;
  bodyText: string;
  status: WorkflowDraftStatus;
  reviewRequired: boolean;
  mustVerify: string;
  mustVerifySources: string;
  riskFlags: string;
  practitionerGuide: string | null;
  caseOutlook: string | null;
  source: "lawbot_bridge";
};

export type WorkflowMappingResult = {
  inquiryUpdate: BridgeWorkflowPersistence;
  caseUpdate?: BridgeWorkflowPersistence;
  caseCreateSuggested: boolean;
  caseTasks: CaseTaskInput[];
  sourceVerificationTasks: SourceVerificationTaskInput[];
  documentRequestTasks: DocumentRequestTaskInput[];
  documentDraft?: DocumentDraftInput;
  messageDraft?: MessageDraftInput;
  approvalPending: boolean;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => String(entry ?? "").trim())
    .filter((entry) => entry.length > 0);
}

function serializeJson(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return JSON.stringify(value);
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return fallback;
}

function normalizeSupplementalReferenceCandidates(
  candidates: unknown
): SupplementalReferenceCandidate[] {
  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const title = String(record.title ?? "").trim();
      if (!title) {
        return null;
      }
      return {
        title,
        sourceType: String(
          record.source_type ?? record.sourceType ?? "internal_archive"
        ).trim() || "internal_archive",
        mustVerifyOriginal: asBoolean(
          record.must_verify_original ?? record.mustVerifyOriginal,
          true
        ),
        trustLevel:
          String(record.trust_level ?? record.trustLevel ?? "unknown").trim() || "unknown",
        usageLocations: asStringArray(record.usage_locations ?? record.usageLocations),
        referenceLevel:
          String(record.reference_level ?? record.referenceLevel ?? "candidate").trim() ||
          "candidate"
      };
    })
    .filter((entry): entry is SupplementalReferenceCandidate => Boolean(entry));
}

function serializePractitionerGuide(response: BridgeBaseResponse) {
  const subtypeKeys = asStringArray(response.matched_subtype_keys);
  const supplementalReferenceCandidates = normalizeSupplementalReferenceCandidates(
    response.supplemental_reference_candidates
  );
  const guide =
    response.practitioner_guide && typeof response.practitioner_guide === "object"
      ? { ...response.practitioner_guide }
      : {};

  if (subtypeKeys.length > 0) {
    (guide as Record<string, unknown>).matched_subtype_keys = subtypeKeys;
  }
  if (supplementalReferenceCandidates.length > 0) {
    (guide as Record<string, unknown>).supplemental_reference_candidates =
      supplementalReferenceCandidates;
  }

  const hasGuideContent = Object.keys(guide).length > 0;
  return hasGuideContent ? JSON.stringify(guide) : null;
}

function serializeArray(values: string[]) {
  return JSON.stringify(values);
}

function basePersistence(
  status: BridgeWorkflowStatus,
  response: BridgeBaseResponse
): BridgeWorkflowPersistence {
  return {
    bridgeWorkflowStatus: status,
    bridgeReviewRequired: Boolean(response.review_required),
    bridgeMustVerify: serializeArray(asStringArray(response.must_verify)),
    bridgeMustVerifySources: serializeArray(asStringArray(response.must_verify_sources)),
    bridgeRiskFlags: serializeArray(asStringArray(response.risk_flags)),
    bridgePractitionerGuide: serializePractitionerGuide(response),
    bridgeCaseOutlook: serializeJson(response.case_outlook)
  };
}

function makeCaseTasksFromMustVerify(
  context: MappingContext,
  response: BridgeBaseResponse,
  taskType: string
) {
  const riskFlags = serializeArray(asStringArray(response.risk_flags));
  return asStringArray(response.must_verify).map(
    (item): CaseTaskInput => ({
      inquiryId: context.inquiryId,
      caseId: context.caseId,
      title: item,
      taskType,
      status: "OPEN",
      reviewRequired: true,
      mustVerify: serializeArray([item]),
      riskFlags,
      source: "lawbot_bridge"
    })
  );
}

function makeSourceVerificationTasks(context: MappingContext, response: BridgeBaseResponse) {
  const riskFlags = serializeArray(asStringArray(response.risk_flags));
  const reviewModels = buildBridgeReviewViewModels({
    reviewRequired: response.review_required,
    mustVerify: asStringArray(response.must_verify),
    mustVerifySources: asStringArray(response.must_verify_sources),
    riskFlags: asStringArray(response.risk_flags),
    matchedSubtypeKeys: asStringArray(response.matched_subtype_keys),
    supplementalReferenceCandidates: response.supplemental_reference_candidates,
    practitionerGuide: response.practitioner_guide ?? null,
    caseOutlook: response.case_outlook ?? null
  });

  return reviewModels.sourceVerificationChecklist.items.map(
    (descriptor): SourceVerificationTaskInput => ({
      inquiryId: context.inquiryId,
      caseId: context.caseId,
      title: `Verify source: ${descriptor.sourceLabel}`,
      authorityBucket: descriptor.authorityBucket,
      sourceLabel: descriptor.sourceLabel,
      sourceCitation: descriptor.sourceCitation ?? undefined,
      notes: descriptor.notes ?? undefined,
      status: "OPEN",
      reviewRequired: true,
      mustVerify: serializeArray([descriptor.sourceLabel]),
      riskFlags,
      source: "lawbot_bridge"
    })
  );
}

function shouldHoldForApproval(response: BridgeBaseResponse) {
  const reviewModels = buildBridgeReviewViewModels({
    reviewRequired: response.review_required,
    mustVerify: asStringArray(response.must_verify),
    mustVerifySources: asStringArray(response.must_verify_sources),
    riskFlags: asStringArray(response.risk_flags),
    matchedSubtypeKeys: asStringArray(response.matched_subtype_keys),
    supplementalReferenceCandidates: response.supplemental_reference_candidates,
    practitionerGuide: response.practitioner_guide ?? null,
    caseOutlook: response.case_outlook ?? null
  });
  return !reviewModels.approvalWorkflowGate.canProceedWithoutApproval;
}

function makeAttentionTasksFromOutlook(context: MappingContext, response: BridgeBaseResponse) {
  const outlook = response.case_outlook ?? undefined;
  const riskFlags = serializeArray(asStringArray(response.risk_flags));
  const missingFacts = asStringArray(outlook?.missing_case_facts);
  const keyDecisionFactors = asStringArray(outlook?.key_decision_factors);

  const missingFactTasks = missingFacts.map(
    (item): CaseTaskInput => ({
      inquiryId: context.inquiryId,
      caseId: context.caseId,
      title: item,
      taskType: "FACT_FOLLOW_UP",
      status: "OPEN",
      reviewRequired: true,
      mustVerify: serializeArray([item]),
      riskFlags,
      source: "lawbot_bridge"
    })
  );

  const attentionTasks = keyDecisionFactors.map(
    (item): CaseTaskInput => ({
      inquiryId: context.inquiryId,
      caseId: context.caseId,
      title: item,
      taskType: "REVIEW_ATTENTION",
      status: "OPEN",
      reviewRequired: false,
      mustVerify: serializeArray([]),
      riskFlags,
      source: "lawbot_bridge"
    })
  );

  return [...missingFactTasks, ...attentionTasks];
}

function makeDocumentRequestTasks(
  context: MappingContext,
  response: BridgeIntakeProfileResponse
) {
  const riskFlags = serializeArray(asStringArray(response.risk_flags));
  const requiredDocuments = asStringArray(response.domain_pack?.required_documents);
  return requiredDocuments.map(
    (item): DocumentRequestTaskInput => ({
      inquiryId: context.inquiryId,
      caseId: context.caseId,
      title: `Collect document: ${item}`,
      documentLabel: item,
      status: "OPEN",
      reviewRequired: false,
      mustVerify: serializeArray([]),
      riskFlags,
      source: "lawbot_bridge"
    })
  );
}

function draftStatusFromResponse(response: BridgeBaseResponse): WorkflowDraftStatus {
  return shouldHoldForApproval(response) ? "APPROVAL_PENDING" : "DRAFT_CREATED";
}

function intakeAnalyzeStatus(response: BridgeIntakeAnalyzeResponse): BridgeWorkflowStatus {
  if (response.review_required) {
    return "TRIAGE_REVIEW";
  }
  if (asStringArray(response.must_verify).length > 0) {
    return "AWAITING_MORE_FACTS";
  }
  return "NEW_INQUIRY";
}

function intakeProfileStatus(response: BridgeIntakeProfileResponse): BridgeWorkflowStatus {
  if (asStringArray(response.must_verify_sources).length > 0) {
    return "AWAITING_SOURCE_VERIFICATION";
  }
  if (response.review_required) {
    return "PROFILE_REVIEW_REQUIRED";
  }
  return "PROFILED";
}

export function mapIntakeAnalyzeResponseToWorkflow(
  context: MappingContext,
  response: BridgeIntakeAnalyzeResponse
): WorkflowMappingResult {
  const status = intakeAnalyzeStatus(response);
  const caseTasks = [
    ...makeCaseTasksFromMustVerify(context, response, "INTAKE_VERIFY"),
    ...makeAttentionTasksFromOutlook(context, response)
  ];

  return {
    inquiryUpdate: basePersistence(status, response),
    caseCreateSuggested: false,
    caseTasks,
    sourceVerificationTasks: [],
    documentRequestTasks: [],
    approvalPending: false
  };
}

export function mapIntakeProfileResponseToWorkflow(
  context: MappingContext,
  response: BridgeIntakeProfileResponse
): WorkflowMappingResult {
  const status = intakeProfileStatus(response);
  const caseTasks = [
    ...makeCaseTasksFromMustVerify(context, response, "PROFILE_VERIFY"),
    ...makeAttentionTasksFromOutlook(context, response),
    ...asStringArray(response.domain_pack?.review_checkpoints).map(
      (item): CaseTaskInput => ({
        inquiryId: context.inquiryId,
        caseId: context.caseId,
        title: item,
        taskType: "REVIEW_CHECKPOINT",
        status: "OPEN",
        reviewRequired: false,
        mustVerify: serializeArray([]),
        riskFlags: serializeArray(asStringArray(response.risk_flags)),
        source: "lawbot_bridge"
      })
    )
  ];

  return {
    inquiryUpdate: basePersistence(status, response),
    caseUpdate: basePersistence(context.caseId ? status : "CASE_CARD_CREATED", response),
    caseCreateSuggested: !context.caseId,
    caseTasks,
    sourceVerificationTasks: makeSourceVerificationTasks(context, response),
    documentRequestTasks: makeDocumentRequestTasks(context, response),
    approvalPending: false
  };
}

export function mapDocumentDraftResponseToWorkflow(
  context: MappingContext,
  response: BridgeDocumentDraftResponse
): WorkflowMappingResult {
  const approvalPending = Boolean(response.draft && shouldHoldForApproval(response));
  const workflowStatus: BridgeWorkflowStatus = approvalPending ? "APPROVAL_PENDING" : "DRAFT_CREATED";

  return {
    inquiryUpdate: basePersistence(workflowStatus, response),
    caseUpdate: basePersistence(workflowStatus, response),
    caseCreateSuggested: false,
    caseTasks: [
      ...makeCaseTasksFromMustVerify(context, response, "DRAFT_VERIFY"),
      ...makeAttentionTasksFromOutlook(context, response)
    ],
    sourceVerificationTasks: makeSourceVerificationTasks(context, response),
    documentRequestTasks: [],
    documentDraft: {
      inquiryId: context.inquiryId,
      caseId: context.caseId,
      draftType: response.draft_type?.trim() || "lawbot_document",
      title:
        typeof response.draft?.document_type === "string"
          ? response.draft.document_type
          : undefined,
      bodyJson: JSON.stringify(response.draft ?? {}),
      status: draftStatusFromResponse(response),
      reviewRequired: Boolean(response.review_required),
      mustVerify: serializeArray(asStringArray(response.must_verify)),
      mustVerifySources: serializeArray(asStringArray(response.must_verify_sources)),
      riskFlags: serializeArray(asStringArray(response.risk_flags)),
      practitionerGuide: serializeJson(response.practitioner_guide),
      caseOutlook: serializeJson(response.case_outlook),
      source: "lawbot_bridge"
    },
    approvalPending
  };
}

export function mapCustomerMessageDraftResponseToWorkflow(
  context: MappingContext,
  response: BridgeCustomerMessageDraftResponse
): WorkflowMappingResult {
  const approvalPending = Boolean(response.draft && shouldHoldForApproval(response));
  const workflowStatus: BridgeWorkflowStatus = approvalPending
    ? "APPROVAL_PENDING"
    : "MESSAGE_DRAFT_CREATED";

  const draftObject = response.draft ?? {};
  const bodyValue = Array.isArray(draftObject.body)
    ? draftObject.body.map((line) => String(line)).join("\n")
    : typeof draftObject.body === "string"
      ? draftObject.body
      : "";

  return {
    inquiryUpdate: basePersistence(workflowStatus, response),
    caseUpdate: basePersistence(workflowStatus, response),
    caseCreateSuggested: false,
    caseTasks: [
      ...makeCaseTasksFromMustVerify(context, response, "MESSAGE_VERIFY"),
      ...makeAttentionTasksFromOutlook(context, response)
    ],
    sourceVerificationTasks: makeSourceVerificationTasks(context, response),
    documentRequestTasks: [],
    messageDraft: {
      inquiryId: context.inquiryId,
      caseId: context.caseId,
      messageKind: response.message_kind?.trim() || "lawbot_message",
      subject:
        typeof draftObject.subject === "string"
          ? draftObject.subject
          : "",
      bodyText: bodyValue,
      status: draftStatusFromResponse(response),
      reviewRequired: Boolean(response.review_required),
      mustVerify: serializeArray(asStringArray(response.must_verify)),
      mustVerifySources: serializeArray(asStringArray(response.must_verify_sources)),
      riskFlags: serializeArray(asStringArray(response.risk_flags)),
      practitionerGuide: serializeJson(response.practitioner_guide),
      caseOutlook: serializeJson(response.case_outlook),
      source: "lawbot_bridge"
    },
    approvalPending
  };
}
