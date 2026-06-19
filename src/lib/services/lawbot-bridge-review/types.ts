export type JsonObject = Record<string, unknown>;

export type SupplementalReferenceCandidate = {
  title: string;
  sourceType: string;
  mustVerifyOriginal: boolean;
  trustLevel: string;
  usageLocations: string[];
  referenceLevel: string;
};

export type BridgeReviewSignalInput = {
  reviewRequired?: boolean;
  mustVerify?: string[];
  mustVerifySources?: string[];
  riskFlags?: string[];
  matchedSubtypeKeys?: string[];
  supplementalReferenceCandidates?: unknown[];
  practitionerGuide?: JsonObject | null;
  caseOutlook?: JsonObject | null;
};

export type LegalAxisClue = {
  id: string;
  axis: string;
  label: string;
  reason: string | null;
  sourceHint: string | null;
  articleTitle: string | null;
  snippet: string | null;
  matchedAxisTags: string[];
  phraseLevelRationale: string | null;
  severity: "high" | "medium" | "low";
  origin:
    | "must_verify_sources"
    | "risk_flags"
    | "practitioner_guide"
    | "case_outlook"
    | "matched_subtype_keys";
};

export type ReviewerAttentionItem = {
  label: string;
  reason: string;
  severity: "high" | "medium" | "low";
  origin: string;
};

export type ReviewerAttentionPanelViewModel = {
  reviewRequired: boolean;
  headline: string;
  items: ReviewerAttentionItem[];
};

export type OperatorAssistItem = {
  action: string;
  detail: string | null;
  origin: string;
};

export type OperatorAssistPanelViewModel = {
  headline: string;
  items: OperatorAssistItem[];
};

export type ReviewerReferenceItem = SupplementalReferenceCandidate & {
  id: string;
  reviewHint: string;
};

export type ReviewerReferencePanelViewModel = {
  headline: string;
  items: ReviewerReferenceItem[];
};

export type SourceVerificationDescriptor = {
  sourceLabel: string;
  authorityBucket: string;
  sourceCitation: string | null;
  notes: string | null;
  articleTitle: string | null;
  snippet: string | null;
  matchedAxisTags: string[];
  phraseLevelRationale: string | null;
  sourceType: string | null;
  mustVerifyOriginal: boolean | null;
  trustLevel: string | null;
  usageLocations: string[];
  referenceLevel: string | null;
};

export type SourceVerificationChecklistItem = {
  id: string;
  sourceLabel: string;
  authorityBucket: string;
  sourceCitation: string | null;
  notes: string | null;
  articleTitle: string | null;
  snippet: string | null;
  matchedAxisTags: string[];
  phraseLevelRationale: string | null;
  sourceType: string | null;
  mustVerifyOriginal: boolean | null;
  trustLevel: string | null;
  usageLocations: string[];
  referenceLevel: string | null;
  required: true;
  reviewRequired: true;
};

export type SourceVerificationChecklistViewModel = {
  headline: string;
  items: SourceVerificationChecklistItem[];
  totalRequired: number;
};

export type ReviewerPatternReviewItem = {
  axis: string;
  clueCount: number;
  highestSeverity: "high" | "medium" | "low";
  sampleLabels: string[];
};

export type ReviewerPatternReviewPanelViewModel = {
  headline: string;
  items: ReviewerPatternReviewItem[];
};

export type ApprovalWorkflowGateBlockerCode =
  | "review_required"
  | "must_verify_pending"
  | "must_verify_sources_pending";

export type ApprovalWorkflowGateViewModel = {
  canProceedWithoutApproval: boolean;
  requiresManualReview: boolean;
  blockerCodes: ApprovalWorkflowGateBlockerCode[];
  cautionRiskFlags: string[];
  summary: string;
};

export type BridgeReviewViewModels = {
  legalAxisClues: LegalAxisClue[];
  reviewerAttentionPanel: ReviewerAttentionPanelViewModel;
  reviewerPatternReviewPanel: ReviewerPatternReviewPanelViewModel;
  operatorAssistPanel: OperatorAssistPanelViewModel;
  reviewerReferencePanel: ReviewerReferencePanelViewModel;
  supplementalReferenceCandidates: SupplementalReferenceCandidate[];
  sourceVerificationDescriptors: SourceVerificationDescriptor[];
  sourceVerificationChecklist: SourceVerificationChecklistViewModel;
  approvalWorkflowGate: ApprovalWorkflowGateViewModel;
};
