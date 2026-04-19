export type StructuredOperationsMemo = {
  memoType?: string;
  recommendationLabel?: string;
  recommendationReason?: string;
  recommendedStatus?: string;
  signalSummary?: string;
  practicalUseStatus?: string;
  summary?: string;
  priorityMaterials?: string[];
  riskFlags?: string[];
  nextChecks?: string[];
};

export type ParsedStructuredOperationsMemo = {
  body: string;
  metadata: StructuredOperationsMemo;
};
