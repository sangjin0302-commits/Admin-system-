import type {
  LawbotMatchedArticle,
  LawbotMatchedInterpretation,
  LawbotMatchedLaw,
  LawbotMatchedPrecedent
} from "@/lib/services/lawbot-case-analysis-match-types";
import type {
  LawbotApplicableLaw,
  LawbotDomainRoute,
  LawbotPrecedentSuggestion,
  LawbotQuestionIntent,
  LawbotRelatedInterpretation,
  LawbotRelatedPrecedent,
  LawbotResearchSubtype,
  LawbotSearchQuery,
  LawbotSupplementalSource
} from "@/lib/services/lawbot-case-analysis-structure-types";
import type { LawbotSyncPayload } from "@/lib/services/lawbot-case-analysis-sync-types";

export type {
  LawbotMatchedArticle,
  LawbotMatchedInterpretation,
  LawbotMatchedLaw,
  LawbotMatchedPrecedent
} from "@/lib/services/lawbot-case-analysis-match-types";
export type {
  LawbotApplicableLaw,
  LawbotDomainRoute,
  LawbotPrecedentSuggestion,
  LawbotQuestionIntent,
  LawbotRelatedInterpretation,
  LawbotRelatedPrecedent,
  LawbotResearchSubtype,
  LawbotSearchQuery,
  LawbotSupplementalSource
} from "@/lib/services/lawbot-case-analysis-structure-types";
export type { LawbotSyncPayload } from "@/lib/services/lawbot-case-analysis-sync-types";

export type LawbotResponse = {
  input_summary: string;
  key_issues: string[];
  followup_facts: string[];
  applicable_laws: LawbotApplicableLaw[];
  analysis_mode?: "internal" | "public_fast";
  precedent_source_type?: "real" | "fallback" | "none";
  interpret_source_type?: "real" | "fallback" | "none";
  next_search_recommendations: string[];
  recommended_search_queries: LawbotSearchQuery[];
  precedent_search_suggestions?: LawbotPrecedentSuggestion[];
  related_precedents?: LawbotRelatedPrecedent[];
  related_interpretations?: LawbotRelatedInterpretation[];
  pros?: string[];
  cons?: string[];
  argument_strategy?: string[];
  counter_argument_points?: string[];
  matched_laws?: LawbotMatchedLaw[];
  matched_articles?: LawbotMatchedArticle[];
  matched_precedents?: LawbotMatchedPrecedent[];
  matched_interpretations?: LawbotMatchedInterpretation[];
  confidence_score?: number;
  confidence_label?: string;
  sync_ready?: boolean;
  match_reason?: string;
  sync_payload?: LawbotSyncPayload;
  practitioner_brief?: string[];
  training_notes?: string[];
  client_ready_summary?: string[];
  practice_playbook?: string[];
  priority_actions?: string[];
  risk_flags?: string[];
  practical_use_status?: string;
  review_required_reasons?: string[];
  critical_missing_facts?: string[];
  question_intents?: LawbotQuestionIntent[];
  intent_notes?: string[];
  subtype_notes?: string[];
  domain_routes?: LawbotDomainRoute[];
  research_subtypes?: LawbotResearchSubtype[];
  research_goal?: string;
  research_tracks?: string[];
  authority_path?: string[];
  initial_checkpoints?: string[];
  practical_checklist?: string[];
  document_checklist?: string[];
  study_guide?: string[];
  playbook_legal_bases?: string[];
  supplemental_source_highlights?: string[];
  source_connection_notes?: string[];
  common_failure_points?: string[];
  followup_narrow_questions?: string[];
  visa_specific_guidance?: string[];
  visa_scenario_guidance?: string[];
  admin_appeal_deep_guidance?: string[];
  admin_appeal_timeline_guidance?: string[];
  licensing_industry_guidance?: string[];
  licensing_sector_deep_guidance?: string[];
  domain_overview_notes?: string[];
  supplemental_sources?: Record<string, LawbotSupplementalSource[]>;
};

export type LawbotCaseAnalysisResult =
  | {
      status: "available";
      data: LawbotResponse;
    }
  | {
      status: "disabled";
      message: string;
    }
  | {
      status: "error";
      message: string;
    };
