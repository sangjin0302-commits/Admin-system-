import {
  mapCustomerMessageDraftResponseToWorkflow,
  mapDocumentDraftResponseToWorkflow,
  mapIntakeAnalyzeResponseToWorkflow,
  mapIntakeProfileResponseToWorkflow
} from "../lawbot-bridge-workflow-mapping-service";
import { buildBridgeReviewViewModels } from "../lawbot-bridge-review-view-models";
import { normalizeBridgeTextDeep } from "../lawbot-bridge-text-normalizer";

import {
  applyWorkflowToCaseRecord,
  applyWorkflowToInquiryRecord,
  buildCaseProfile,
  buildFactInput,
  isWorkflowLockedForRerun,
  parseJsonObjectOrNull,
  parseStringArray,
  parseSubtypeKeysFromObjects,
  withCaseId,
  withDocumentDraftId,
  withMessageDraftId,
  withoutCaseId
} from "./helpers";
import {
  LawbotBridgeWorkflowLockedError,
  type BridgeWorkflowPersistencePort,
  type LawbotBridgeCaseWorkflowResult,
  type LawbotBridgeWorkflowClient,
  type RunLawbotBridgeCaseWorkflowOptions
} from "./types";

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
  let caseRecord = await dependencies.persistence.getCaseByInquiryId(inquiry.id);
  const currentWorkflowStatus = caseRecord?.bridgeWorkflowStatus ?? inquiry.bridgeWorkflowStatus;
  const existingReviewQueue = dependencies.persistence.getBridgeReviewQueueSnapshot
    ? await dependencies.persistence.getBridgeReviewQueueSnapshot(inquiry.id)
    : { totalDrafts: 0, approvalPendingDrafts: 0 };
  const hasExistingDrafts = existingReviewQueue.totalDrafts > 0;
  const hasApprovalPendingDrafts = existingReviewQueue.approvalPendingDrafts > 0;

  if (
    isWorkflowLockedForRerun(currentWorkflowStatus) ||
    hasExistingDrafts ||
    hasApprovalPendingDrafts
  ) {
    throw new LawbotBridgeWorkflowLockedError(
      `Workflow already locked for inquiry ${inquiry.id}. status=${currentWorkflowStatus ?? "NONE"} totalDrafts=${existingReviewQueue.totalDrafts} approvalPendingDrafts=${existingReviewQueue.approvalPendingDrafts}`
    );
  }

  const factInput = buildFactInput(inquiry);
  const requestPrefix = `${inquiry.id}-${Date.now()}`;

  const analyzeResponse = await dependencies.client.intakeAnalyze({
    requestId: `${requestPrefix}-intake-analyze`,
    factInput,
    caseProfile: buildCaseProfile(inquiry, caseRecord)
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
  const analyzeCaseTasks = withoutCaseId(analyzeMapping.caseTasks);
  if (analyzeCaseTasks.length > 0) {
    await dependencies.persistence.createCaseTasks(analyzeCaseTasks);
  }

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

  const profileCaseTasks = withoutCaseId(profileMapping.caseTasks);
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
  const documentCaseTasks = withoutCaseId(documentMapping.caseTasks);
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
  const messageCaseTasks = withoutCaseId(messageMapping.caseTasks);
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
  const enrichedReviewSignals = normalizeBridgeTextDeep({
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
  });

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
        analyzeCaseTasks.length +
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
