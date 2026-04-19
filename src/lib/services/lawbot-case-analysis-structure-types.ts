export type LawbotApplicableLaw = {
  law: string;
  summary: string;
};

export type LawbotSearchQuery = {
  kind: "law" | "precedent" | "interpretation" | "general";
  query: string;
  label: string;
};

export type LawbotPrecedentSuggestion = {
  query: string;
};

export type LawbotRelatedPrecedent = {
  case_name: string;
  case_number: string;
  decision_date?: string | null;
  court_name?: string | null;
  reason: string;
};

export type LawbotRelatedInterpretation = {
  title: string;
  number?: string | null;
  decision_date?: string | null;
  agency?: string | null;
  reason: string;
};

export type LawbotSupplementalSource = {
  title: string;
  snippet?: string | null;
  path?: string | null;
  query?: string | null;
  command?: string | null;
  number?: string | null;
  date?: string | null;
  source?: string | null;
  kind?: string | null;
};

export type LawbotQuestionIntent = {
  key: string;
  label: string;
  reason?: string;
  note?: string;
};

export type LawbotDomainRoute = {
  key: string;
  label: string;
  score?: number;
  why?: string;
  priority_sources?: string[];
};

export type LawbotResearchSubtype = {
  key: string;
  domain_key: string;
  label: string;
  score?: number;
  note?: string;
};
