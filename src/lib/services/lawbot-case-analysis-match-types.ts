export type LawbotMatchedLaw = {
  law: string;
  exact_name?: string;
  kind?: string | null;
  ministry?: string | null;
  effective_date?: string | null;
  promulgation_date?: string | null;
  link?: string | null;
  article_hints?: string[] | null;
  match_type?: string;
  summary?: string;
  score?: number;
  confidence?: number;
  reason?: string;
  match_reason?: string;
};

export type LawbotMatchedArticle = {
  law?: string;
  law_name: string;
  article?: string;
  article_label: string;
  article_key?: string | null;
  jo?: string;
  summary?: string;
  full_text?: string;
  article_text?: string | null;
  confidence?: number;
  match_reason?: string;
};

export type LawbotMatchedPrecedent = {
  case_name: string;
  case_number?: string | null;
  score?: number;
  confidence?: number;
  reason?: string;
  match_reason?: string;
  decision_date?: string | null;
  court_name?: string | null;
  summary?: string | null;
  refs?: string | null;
  link?: string | null;
  matched_query?: string | null;
};

export type LawbotMatchedInterpretation = {
  title: string;
  number?: string | null;
  score?: number;
  confidence?: number;
  reason?: string;
  match_reason?: string;
  decision_date?: string | null;
  agency?: string | null;
  summary?: string | null;
  reasoning?: string | null;
  matched_query?: string | null;
};
