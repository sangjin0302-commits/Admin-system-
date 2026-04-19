export type InquiryChecklistStateSnapshot = {
  memo: string;
  block: string | null;
  doneIds: string[];
};

export type ParsedLawbotOperationalSignals = {
  reviewRequiredReasons: string[];
  criticalMissingFacts: string[];
  documentChecklist: string[];
};

export type InquiryChecklistProgress = {
  total: number;
  done: number;
  pending: number;
  percent: number;
  hasChecklist: boolean;
};
