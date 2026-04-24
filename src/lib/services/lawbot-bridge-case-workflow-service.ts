import {
  mapCustomerMessageDraftResponseToWorkflow,
  mapDocumentDraftResponseToWorkflow,
  mapIntakeAnalyzeResponseToWorkflow,
  mapIntakeProfileResponseToWorkflow,
  type BridgeCustomerMessageDraftResponse,
  type BridgeDocumentDraftResponse,
  type BridgeIntakeAnalyzeResponse,
  type BridgeIntakeProfileResponse,
  type BridgeWorkflowPersistence,
  type CaseTaskInput,
  type DocumentDraftInput,
  type DocumentRequestTaskInput,
  type MessageDraftInput,
  type SourceVerificationTaskInput
} from "./lawbot-bridge-workflow-mapping-service.ts";
import {
  buildBridgeReviewViewModels,
  type ApprovalWorkflowGateViewModel,
  type LegalAxisClue,
  type OperatorAssistPanelViewModel,
  type ReviewerReferencePanelViewModel,
  type ReviewerPatternReviewPanelViewModel,
  type SourceVerificationChecklistViewModel,
  type ReviewerAttentionPanelViewModel,
  type SupplementalReferenceCandidate
} from "./lawbot-bridge-review-view-models.ts";

type JsonObject = Record<string, unknown>;

export type WorkflowInquiryRecord = {
  id: string;
  contactName: string;
  title: string;
  description: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  currentStatus?: string | null;
  requestedOutcome?: string | null;
  targetAgency?: string | null;
  generatedSummary?: string | null;
  classificationReason?: string | null;
  recommendedNextStep?: string | null;
  bridgeWorkflowStatus?: string | null;
  bridgeReviewRequired?: boolean;
  bridgeMustVerify?: string;
  bridgeMustVerifySources?: string;
  bridgeRiskFlags?: string;
  bridgePractitionerGuide?: string | null;
  bridgeCaseOutlook?: string | null;
};

export type WorkflowCaseRecord = {
  id: string;
  inquiryId: string;
  caseNumber: string;
  bridgeWorkflowStatus?: string | null;
  bridgeReviewRequired?: boolean;
  bridgeMustVerify?: string;
  bridgeMustVerifySources?: string;
  bridgeRiskFlags?: string;
  bridgePractitionerGuide?: string | null;
  bridgeCaseOutlook?: string | null;
};

export type LawbotBridgeIntakeAnalyzeRequest = {
  requestId: string;
  factInput: string;
  caseProfile?: JsonObject | null;
};

export type LawbotBridgeIntakeProfileRequest = {
  requestId: string;
  factInput: string;
  caseProfile?: JsonObject | null;
};

export type LawbotBridgeDocumentDraftRequest = {
  requestId: string;
  draftKind: string;
  factInput: string;
  caseProfile?: JsonObject | null;
  options?: {
    includeTraceability?: boolean;
  };
};

export type LawbotBridgeCustomerMessageDraftRequest = {
  requestId: string;
  messageKind: string;
  tone?: string;
  factInput: string;
  caseProfile?: JsonObject | null;
};

export type LawbotBridgeWorkflowClient = {
  intakeAnalyze(
    request: LawbotBridgeIntakeAnalyzeRequest
  ): Promise<BridgeIntakeAnalyzeResponse>;
  intakeProfile(
    request: LawbotBridgeIntakeProfileRequest
  ): Promise<BridgeIntakeProfileResponse>;
  createDocumentDraft(
    request: LawbotBridgeDocumentDraftRequest
  ): Promise<BridgeDocumentDraftResponse>;
  createCustomerMessageDraft(
    request: LawbotBridgeCustomerMessageDraftRequest
  ): Promise<BridgeCustomerMessageDraftResponse>;
};

export type WorkflowDraftRecord = {
  id: string;
};

export type BridgeWorkflowPersistencePort = {
  getInquiryById(inquiryId: string): Promise<WorkflowInquiryRecord | null>;
  getCaseByInquiryId(inquiryId: string): Promise<WorkflowCaseRecord | null>;
  updateInquiryWorkflow(
    inquiryId: string,
    update: BridgeWorkflowPersistence
  ): Promise<void>;
  createCaseForInquiry(input: {
    inquiry: WorkflowInquiryRecord;
    workflow: BridgeWorkflowPersistence;
  }): Promise<WorkflowCaseRecord>;
  updateCaseWorkflow(
    caseId: string,
    update: BridgeWorkflowPersistence
  ): Promise<void>;
  createCaseTasks(tasks: CaseTaskInput[]): Promise<void>;
  createSourceVerificationTasks(
    tasks: (SourceVerificationTaskInput & {
      documentDraftId?: string;
      messageDraftId?: string;
    })[]
  ): Promise<void>;
  createDocumentRequestTasks(tasks: DocumentRequestTaskInput[]): Promise<void>;
  createDocumentDraft(draft: DocumentDraftInput): Promise<WorkflowDraftRecord>;
  createMessageDraft(draft: MessageDraftInput): Promise<WorkflowDraftRecord>;
};

export type RunLawbotBridgeCaseWorkflowOptions = {
  inquiryId: string;
  documentDraftKind?: string;
  customerMessageKind?: string;
  customerMessageTone?: string;
};

export type LawbotBridgeCaseWorkflowResult = {
  inquiryId: string;
  caseId: string;
  caseNumber: string;
  inquiryWorkflowStatus: string;
  caseWorkflowStatus: string;
  documentDraftId: string;
  messageDraftId: string;
  createdCounts: {
    caseTasks: number;
    sourceVerificationTasks: number;
    documentRequestTasks: number;
  };
  approvalPending: boolean;
  reviewSignals: {
    reviewRequired: boolean;
    mustVerify: string[];
    mustVerifySources: string[];
    riskFlags: string[];
    matchedSubtypeKeys: string[];
    practitionerGuide: JsonObject | null;
    caseOutlook: JsonObject | null;
    supplementalReferenceCandidates: SupplementalReferenceCandidate[];
    legalAxisClues: LegalAxisClue[];
    reviewerAttentionPanel: ReviewerAttentionPanelViewModel;
    reviewerPatternReviewPanel: ReviewerPatternReviewPanelViewModel;
    operatorAssistPanel: OperatorAssistPanelViewModel;
    reviewerReferencePanel: ReviewerReferencePanelViewModel;
    sourceVerificationChecklist: SourceVerificationChecklistViewModel;
    approvalWorkflowGate: ApprovalWorkflowGateViewModel;
  };
};

function parseJsonObject(raw: string | null | undefined) {
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

function parseStringArray(raw: string | null | undefined) {
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

function parseSubtypeKeysFromObjects(input: {
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

function buildFactInput(inquiry: WorkflowInquiryRecord) {
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

function buildCaseProfile(
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

function applyWorkflowToInquiryRecord(
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

function applyWorkflowToCaseRecord(
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

function withCaseId<T extends { caseId?: string }>(items: T[], caseId: string) {
  return items.map((item) => ({
    ...item,
    caseId
  }));
}

function withDocumentDraftId(
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

function withMessageDraftId(
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

function parseJsonObjectOrNull(raw: string | null | undefined): JsonObject | null {
  return parseJsonObject(raw) ?? null;
}

export async function runLawbotBridgeCaseWorkflow(
  dependencies: {
    client: LawbotBridgeWorkflowClient;
    persistence: BridgeWorkflowPersistencePort;
  },
  options: RunLawbotBridgeCaseWorkflowOptions
): Promise<LawbotBridgeCaseWorkflowResult> {
  const storedInquiry = await dependencies.persistence.getInquiryById(options.inquiryId);
  if (!storedInquiry) {
    throw new Error(`Inquiry not found: ${options.inquiryId}`);
  }
  let inquiry = storedInquiry;

  const factInput = buildFactInput(inquiry);
  const requestPrefix = `${inquiry.id}-${Date.now()}`;

  const analyzeResponse = await dependencies.client.intakeAnalyze({
    requestId: `${requestPrefix}-intake-analyze`,
    factInput,
    caseProfile: buildCaseProfile(inquiry)
  });
  const analyzeMapping = mapIntakeAnalyzeResponseToWorkflow(
    { inquiryId: inquiry.id },
    analyzeResponse
  );
  await dependencies.persistence.updateInquiryWorkflow(
    inquiry.id,
    analyzeMapping.inquiryUpdate
  );
  inquiry = applyWorkflowToInquiryRecord(inquiry, analyzeMapping.inquiryUpdate);
  if (analyzeMapping.caseTasks.length > 0) {
    await dependencies.persistence.createCaseTasks(analyzeMapping.caseTasks);
  }

  let caseRecord = await dependencies.persistence.getCaseByInquiryId(inquiry.id);

  const profileResponse = await dependencies.client.intakeProfile({
    requestId: `${requestPrefix}-intake-profile`,
    factInput,
    caseProfile: buildCaseProfile(inquiry, caseRecord)
  });
  const profileMapping = mapIntakeProfileResponseToWorkflow(
    { inquiryId: inquiry.id, caseId: caseRecord?.id },
    profileResponse
  );
  await dependencies.persistence.updateInquiryWorkflow(
    inquiry.id,
    profileMapping.inquiryUpdate
  );
  inquiry = applyWorkflowToInquiryRecord(inquiry, profileMapping.inquiryUpdate);

  if (!caseRecord) {
    caseRecord = await dependencies.persistence.createCaseForInquiry({
      inquiry,
      workflow: profileMapping.caseUpdate ?? profileMapping.inquiryUpdate
    });
  } else if (profileMapping.caseUpdate) {
    await dependencies.persistence.updateCaseWorkflow(caseRecord.id, profileMapping.caseUpdate);
    caseRecord = applyWorkflowToCaseRecord(caseRecord, profileMapping.caseUpdate);
  }

  const profileCaseTasks = withCaseId(profileMapping.caseTasks, caseRecord.id);
  if (profileCaseTasks.length > 0) {
    await dependencies.persistence.createCaseTasks(profileCaseTasks);
  }

  const sourceVerificationTasks = withCaseId(
    profileMapping.sourceVerificationTasks,
    caseRecord.id
  );
  if (sourceVerificationTasks.length > 0) {
    await dependencies.persistence.createSourceVerificationTasks(sourceVerificationTasks);
  }

  const documentRequestTasks = withCaseId(
    profileMapping.documentRequestTasks,
    caseRecord.id
  );
  if (documentRequestTasks.length > 0) {
    await dependencies.persistence.createDocumentRequestTasks(documentRequestTasks);
  }

  const refreshedCaseProfile = buildCaseProfile(inquiry, caseRecord);

  const documentDraftResponse = await dependencies.client.createDocumentDraft({
    requestId: `${requestPrefix}-document-draft`,
    draftKind: options.documentDraftKind ?? "case_document",
    factInput,
    caseProfile: refreshedCaseProfile,
    options: {
      includeTraceability: true
    }
  });
  const documentMapping = mapDocumentDraftResponseToWorkflow(
    { inquiryId: inquiry.id, caseId: caseRecord.id },
    documentDraftResponse
  );
  await dependencies.persistence.updateInquiryWorkflow(
    inquiry.id,
    documentMapping.inquiryUpdate
  );
  inquiry = applyWorkflowToInquiryRecord(inquiry, documentMapping.inquiryUpdate);
  if (documentMapping.caseUpdate) {
    await dependencies.persistence.updateCaseWorkflow(caseRecord.id, documentMapping.caseUpdate);
    caseRecord = applyWorkflowToCaseRecord(caseRecord, documentMapping.caseUpdate);
  }
  const documentCaseTasks = withCaseId(documentMapping.caseTasks, caseRecord.id);
  if (documentCaseTasks.length > 0) {
    await dependencies.persistence.createCaseTasks(documentCaseTasks);
  }
  if (!documentMapping.documentDraft) {
    throw new Error("Lawbot bridge document draft response did not include draft payload.");
  }
  const documentDraftRecord = await dependencies.persistence.createDocumentDraft({
    ...documentMapping.documentDraft,
    caseId: caseRecord.id
  });
  const documentSourceTasks = withDocumentDraftId(
    documentMapping.sourceVerificationTasks,
    caseRecord.id,
    documentDraftRecord.id
  );
  if (documentSourceTasks.length > 0) {
    await dependencies.persistence.createSourceVerificationTasks(documentSourceTasks);
  }

  const customerMessageResponse = await dependencies.client.createCustomerMessageDraft({
    requestId: `${requestPrefix}-customer-message-draft`,
    messageKind: options.customerMessageKind ?? "client_follow_up",
    tone: options.customerMessageTone ?? "professional",
    factInput,
    caseProfile: refreshedCaseProfile
  });
  const messageMapping = mapCustomerMessageDraftResponseToWorkflow(
    { inquiryId: inquiry.id, caseId: caseRecord.id },
    customerMessageResponse
  );
  await dependencies.persistence.updateInquiryWorkflow(
    inquiry.id,
    messageMapping.inquiryUpdate
  );
  inquiry = applyWorkflowToInquiryRecord(inquiry, messageMapping.inquiryUpdate);
  if (messageMapping.caseUpdate) {
    await dependencies.persistence.updateCaseWorkflow(caseRecord.id, messageMapping.caseUpdate);
    caseRecord = applyWorkflowToCaseRecord(caseRecord, messageMapping.caseUpdate);
  }
  const messageCaseTasks = withCaseId(messageMapping.caseTasks, caseRecord.id);
  if (messageCaseTasks.length > 0) {
    await dependencies.persistence.createCaseTasks(messageCaseTasks);
  }
  if (!messageMapping.messageDraft) {
    throw new Error("Lawbot bridge customer message response did not include draft payload.");
  }
  const messageDraftRecord = await dependencies.persistence.createMessageDraft({
    ...messageMapping.messageDraft,
    caseId: caseRecord.id
  });
  const messageSourceTasks = withMessageDraftId(
    messageMapping.sourceVerificationTasks,
    caseRecord.id,
    messageDraftRecord.id
  );
  if (messageSourceTasks.length > 0) {
    await dependencies.persistence.createSourceVerificationTasks(messageSourceTasks);
  }

  const approvalPending = documentMapping.approvalPending || messageMapping.approvalPending;
  const reviewSignals = {
    reviewRequired: caseRecord.bridgeReviewRequired ?? false,
    mustVerify: parseStringArray(caseRecord.bridgeMustVerify),
    mustVerifySources: parseStringArray(caseRecord.bridgeMustVerifySources),
    riskFlags: parseStringArray(caseRecord.bridgeRiskFlags),
    practitionerGuide: parseJsonObjectOrNull(caseRecord.bridgePractitionerGuide),
    caseOutlook: parseJsonObjectOrNull(caseRecord.bridgeCaseOutlook)
  };
  const matchedSubtypeKeys = parseSubtypeKeysFromObjects(reviewSignals);
  const reviewViewModels = buildBridgeReviewViewModels({
    ...reviewSignals,
    matchedSubtypeKeys
  });
  const enrichedReviewSignals = {
    ...reviewSignals,
    matchedSubtypeKeys,
    supplementalReferenceCandidates: reviewViewModels.supplementalReferenceCandidates,
    legalAxisClues: reviewViewModels.legalAxisClues,
    reviewerAttentionPanel: reviewViewModels.reviewerAttentionPanel,
    reviewerPatternReviewPanel: reviewViewModels.reviewerPatternReviewPanel,
    operatorAssistPanel: reviewViewModels.operatorAssistPanel,
    reviewerReferencePanel: reviewViewModels.reviewerReferencePanel,
    sourceVerificationChecklist: reviewViewModels.sourceVerificationChecklist,
    approvalWorkflowGate: reviewViewModels.approvalWorkflowGate
  };

  return {
    inquiryId: inquiry.id,
    caseId: caseRecord.id,
    caseNumber: caseRecord.caseNumber,
    inquiryWorkflowStatus: messageMapping.inquiryUpdate.bridgeWorkflowStatus,
    caseWorkflowStatus: caseRecord.bridgeWorkflowStatus ?? "CASE_CARD_CREATED",
    documentDraftId: documentDraftRecord.id,
    messageDraftId: messageDraftRecord.id,
    createdCounts: {
      caseTasks:
        analyzeMapping.caseTasks.length +
        profileCaseTasks.length +
        documentCaseTasks.length +
        messageCaseTasks.length,
      sourceVerificationTasks:
        sourceVerificationTasks.length +
        documentSourceTasks.length +
        messageSourceTasks.length,
      documentRequestTasks: documentRequestTasks.length
    },
    approvalPending,
    reviewSignals: enrichedReviewSignals
  };
}
