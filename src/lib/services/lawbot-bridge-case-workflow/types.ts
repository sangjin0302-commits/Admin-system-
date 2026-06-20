import type {
  BridgeCustomerMessageDraftResponse,
  BridgeDocumentDraftResponse,
  BridgeIntakeAnalyzeResponse,
  BridgeIntakeProfileResponse,
  BridgeWorkflowPersistence,
  CaseTaskInput,
  DocumentDraftInput,
  DocumentRequestTaskInput,
  MessageDraftInput,
  SourceVerificationTaskInput
} from "../lawbot-bridge-workflow-mapping-service";
import type {
  ApprovalWorkflowGateViewModel,
  LegalAxisClue,
  OperatorAssistPanelViewModel,
  ReviewerAttentionPanelViewModel,
  ReviewerPatternReviewPanelViewModel,
  ReviewerReferencePanelViewModel,
  SourceVerificationChecklistViewModel,
  SupplementalReferenceCandidate
} from "../lawbot-bridge-review-view-models";

export type JsonObject = Record<string, unknown>;

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
  getBridgeReviewQueueSnapshot?(
    inquiryId: string
  ): Promise<{ totalDrafts: number; approvalPendingDrafts: number }>;
};

export type RunLawbotBridgeCaseWorkflowOptions = {
  inquiryId: string;
  documentDraftKind?: string;
  customerMessageKind?: string;
  customerMessageTone?: string;
};

export class LawbotBridgeWorkflowLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LawbotBridgeWorkflowLockedError";
  }
}

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
