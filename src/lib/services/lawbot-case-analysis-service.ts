import type { InquiryRecord } from "@/lib/services/inquiry-service";

type LawbotApplicableLaw = {
  law: string;
  summary: string;
};

type LawbotSearchQuery = {
  kind: "law" | "precedent" | "interpretation" | "general";
  query: string;
  label: string;
};

type LawbotPrecedentSuggestion = {
  query: string;
};

type LawbotRelatedPrecedent = {
  case_name: string;
  case_number: string;
  decision_date?: string | null;
  court_name?: string | null;
  reason: string;
};

type LawbotRelatedInterpretation = {
  title: string;
  number?: string | null;
  decision_date?: string | null;
  agency?: string | null;
  reason: string;
};

type LawbotMatchedLaw = {
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

type LawbotMatchedArticle = {
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

type LawbotMatchedPrecedent = {
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

type LawbotMatchedInterpretation = {
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

type LawbotSupplementalSource = {
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

type LawbotQuestionIntent = {
  key: string;
  label: string;
  reason?: string;
  note?: string;
};

type LawbotDomainRoute = {
  key: string;
  label: string;
  score?: number;
  why?: string;
  priority_sources?: string[];
};

type LawbotResearchSubtype = {
  key: string;
  domain_key: string;
  label: string;
  score?: number;
  note?: string;
};

type LawbotSyncPayload = {
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

type LawbotResponse = {
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

function buildFactInputLines(inquiry: NonNullable<InquiryRecord>) {
  return [
    `사건 제목: ${inquiry.title}`,
    `문의 유형: ${inquiry.inquiryType}`,
    inquiry.contactName ? `이름: ${inquiry.contactName}` : null,
    inquiry.nationality ? `국적: ${inquiry.nationality}` : null,
    inquiry.currentStatus ? `현재 상태: ${inquiry.currentStatus}` : null,
    inquiry.targetAgency ? `관할 기관: ${inquiry.targetAgency}` : null,
    inquiry.requestedOutcome ? `원하는 결과: ${inquiry.requestedOutcome}` : null,
    inquiry.description ? `상세 내용: ${inquiry.description}` : null,
    inquiry.generatedSummary ? `기존 요약: ${inquiry.generatedSummary}` : null,
    inquiry.classificationReason ? `분류 근거: ${inquiry.classificationReason}` : null,
    inquiry.recommendedNextStep ? `기존 권장 조치: ${inquiry.recommendedNextStep}` : null
  ].filter((value): value is string => Boolean(value));
}

function buildFactInput(inquiry: NonNullable<InquiryRecord>) {
  return buildFactInputLines(inquiry).join("\n");
}

export function buildLawbotConnectionSnapshot(
  inquiry: NonNullable<InquiryRecord>
): LawbotConnectionSnapshot {
  const analyzeUrl = process.env.LAWBOT_ANALYZE_URL?.trim();
  const analyzeToken = process.env.LAWBOT_ANALYZE_TOKEN?.trim();
  const availableContextLabels = [
    inquiry.contactName ? "이름" : null,
    inquiry.nationality ? "국적" : null,
    inquiry.currentStatus ? "현재 상태" : null,
    inquiry.targetAgency ? "관할 기관" : null,
    inquiry.requestedOutcome ? "원하는 결과" : null,
    inquiry.description ? "상세 내용" : null,
    inquiry.generatedSummary ? "기존 요약" : null,
    inquiry.classificationReason ? "분류 근거" : null,
    inquiry.recommendedNextStep ? "기존 권장 조치" : null
  ].filter((value): value is string => Boolean(value));
  const recommendedMissingFields = [
    inquiry.description ? null : "상세 내용",
    inquiry.requestedOutcome ? null : "원하는 결과",
    inquiry.currentStatus ? null : "현재 상태",
    inquiry.targetAgency ? null : "관할 기관",
    inquiry.nationality ? null : "국적"
  ].filter((value): value is string => Boolean(value));

  return {
    connectionReady: Boolean(analyzeUrl && analyzeToken),
    hasAnalyzeUrl: Boolean(analyzeUrl),
    hasAnalyzeToken: Boolean(analyzeToken),
    recommendedMissingFields,
    availableContextLabels,
    factInputPreview: buildFactInputLines(inquiry).join("\n")
  };
}

export function buildStoredLawbotSnapshot(
  inquiry: Pick<
    NonNullable<InquiryRecord>,
    | "lawbotLastAnalyzedAt"
    | "lawbotSnapshotVersion"
    | "lawbotSnapshotStatus"
    | "lawbotSnapshotSummary"
    | "lawbotSnapshotPayload"
  >
): StoredLawbotSnapshot | null {
  if (
    !inquiry.lawbotLastAnalyzedAt &&
    !inquiry.lawbotSnapshotStatus &&
    !inquiry.lawbotSnapshotSummary &&
    !inquiry.lawbotSnapshotPayload
  ) {
    return null;
  }

  let payload: StoredLawbotSnapshot["payload"] = null;

  if (inquiry.lawbotSnapshotPayload) {
    try {
      payload = JSON.parse(inquiry.lawbotSnapshotPayload) as StoredLawbotSnapshot["payload"];
    } catch {
      payload = null;
    }
  }

  return {
    analyzedAt: inquiry.lawbotLastAnalyzedAt?.toISOString() ?? null,
    version: inquiry.lawbotSnapshotVersion ?? 1,
    status: inquiry.lawbotSnapshotStatus ?? null,
    summary: inquiry.lawbotSnapshotSummary ?? null,
    payload
  };
}

export async function getLawbotCaseAnalysis(
  inquiry: NonNullable<InquiryRecord>
): Promise<LawbotCaseAnalysisResult> {
  const analyzeUrl = process.env.LAWBOT_ANALYZE_URL?.trim();
  const analyzeToken = process.env.LAWBOT_ANALYZE_TOKEN?.trim();

  if (!analyzeUrl) {
    return {
      status: "disabled",
      message: "Lawbot 분석 주소가 아직 설정되지 않아 내부 사건 분석만 표시합니다."
    };
  }

  const timeoutMs = Number(process.env.LAWBOT_ANALYZE_TIMEOUT_MS ?? "8000");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(analyzeToken ? { "x-lawbot-token": analyzeToken } : {})
      },
      body: JSON.stringify({
        fact_input: buildFactInput(inquiry)
      }),
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        status: "error",
        message: `Lawbot 분석 호출에 실패했습니다. (${response.status})`
      };
    }

    const json = (await response.json()) as LawbotResponse;

    return {
      status: "available",
      data: json
    };
  } catch {
    return {
      status: "error",
      message: "Lawbot 분석 서버에 연결하지 못했습니다. 주소 또는 서비스 상태를 확인해 주세요."
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
