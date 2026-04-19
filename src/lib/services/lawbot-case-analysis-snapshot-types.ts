export type LawbotConnectionSnapshot = {
  connectionReady: boolean;
  hasAnalyzeUrl: boolean;
  hasAnalyzeToken: boolean;
  recommendedMissingFields: string[];
  availableContextLabels: string[];
  factInputPreview: string;
};

export type StoredLawbotSnapshot = {
  analyzedAt: string | null;
  version: number;
  status: string | null;
  summary: string | null;
  payload: {
    input_summary?: string;
    practical_use_status?: string;
    confidence_score?: number;
    confidence_label?: string;
    match_reason?: string;
    research_goal?: string;
    review_required_reasons?: string[];
    critical_missing_facts?: string[];
    priority_actions?: string[];
    risk_flags?: string[];
    practical_checklist?: string[];
    document_checklist?: string[];
  } | null;
};
