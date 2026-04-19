import type {
  LawbotMatchedArticle,
  LawbotMatchedInterpretation,
  LawbotMatchedLaw,
  LawbotMatchedPrecedent
} from "@/lib/services/lawbot-case-analysis-match-types";
import type {
  LawbotDomainRoute,
  LawbotResearchSubtype
} from "@/lib/services/lawbot-case-analysis-structure-types";

export type LawbotSyncPayload = {
  inquiry_summary?: string;
  confidence_score?: number;
  confidence_label?: string;
  match_reason?: string;
  matched_laws?: LawbotMatchedLaw[];
  matched_articles?: LawbotMatchedArticle[];
  matched_precedents?: LawbotMatchedPrecedent[];
  matched_interpretations?: LawbotMatchedInterpretation[];
  priority_actions?: string[];
  risk_flags?: string[];
  primary_law?: string;
  primary_article?: string;
  primary_precedent?: string;
  supplemental_sources?: string[];
  practical_use_status?: string;
  review_required_reasons?: string[];
  critical_missing_facts?: string[];
  domain_routes?: LawbotDomainRoute[];
  research_subtypes?: LawbotResearchSubtype[];
  research_goal?: string;
  practical_checklist?: string[];
  document_checklist?: string[];
  study_guide?: string[];
  visa_specific_guidance?: string[];
  visa_scenario_guidance?: string[];
  admin_appeal_deep_guidance?: string[];
  admin_appeal_timeline_guidance?: string[];
  licensing_industry_guidance?: string[];
  licensing_sector_deep_guidance?: string[];
};
