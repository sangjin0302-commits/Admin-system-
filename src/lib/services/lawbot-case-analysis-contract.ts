import type {
  LawbotResponse
} from "@/lib/services/lawbot-case-analysis-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item));
}

function asStringArrayOrEmpty(value: unknown): string[] {
  return asStringArray(value) ?? [];
}

function asApplicableLaws(value: unknown): LawbotResponse["applicable_laws"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const law = asString(item.law);
      const summary = asString(item.summary);
      if (!law || !summary) return null;
      return { law, summary };
    })
    .filter((item): item is LawbotResponse["applicable_laws"][number] => Boolean(item));
}

function asSearchQueries(value: unknown): LawbotResponse["recommended_search_queries"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const query = asString(item.query);
      const label = asString(item.label);
      const kindRaw = asString(item.kind);
      const kind =
        kindRaw === "law" || kindRaw === "precedent" || kindRaw === "interpretation" || kindRaw === "general"
          ? kindRaw
          : "general";

      if (!query) return null;
      return {
        kind,
        query,
        label: label ?? query
      };
    })
    .filter((item): item is LawbotResponse["recommended_search_queries"][number] => Boolean(item));
}

function asSimpleObjectArray<T>(
  value: unknown,
  mapper: (item: Record<string, unknown>) => T | null
): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const mapped = value
    .map((item) => (isRecord(item) ? mapper(item) : null))
    .filter((item): item is T => Boolean(item));
  return mapped.length > 0 ? mapped : [];
}

export function normalizeLawbotResponse(raw: unknown):
  | { ok: true; data: LawbotResponse }
  | { ok: false; reason: string } {
  if (!isRecord(raw)) {
    return { ok: false, reason: "response is not an object" };
  }

  const inputSummary = asString(raw.input_summary);
  if (!inputSummary) {
    return { ok: false, reason: "input_summary is missing" };
  }

  const nextSearchRecommendations = asStringArrayOrEmpty(raw.next_search_recommendations);
  const recommendedSearchQueriesRaw = asSearchQueries(raw.recommended_search_queries);
  const recommendedSearchQueries =
    recommendedSearchQueriesRaw.length > 0
      ? recommendedSearchQueriesRaw
      : nextSearchRecommendations.map((query) => ({
          kind: "general" as const,
          query,
          label: query
        }));

  const applicableLaws = asApplicableLaws(raw.applicable_laws);

  const response: LawbotResponse = {
    input_summary: inputSummary,
    key_issues: asStringArrayOrEmpty(raw.key_issues),
    followup_facts: asStringArrayOrEmpty(raw.followup_facts),
    applicable_laws: applicableLaws,
    next_search_recommendations: nextSearchRecommendations,
    recommended_search_queries: recommendedSearchQueries,
    analysis_mode: raw.analysis_mode === "internal" || raw.analysis_mode === "public_fast" ? raw.analysis_mode : undefined,
    precedent_source_type:
      raw.precedent_source_type === "real" || raw.precedent_source_type === "fallback" || raw.precedent_source_type === "none"
        ? raw.precedent_source_type
        : undefined,
    interpret_source_type:
      raw.interpret_source_type === "real" || raw.interpret_source_type === "fallback" || raw.interpret_source_type === "none"
        ? raw.interpret_source_type
        : undefined,
    precedent_search_suggestions: asSimpleObjectArray(raw.precedent_search_suggestions, (item) => {
      const query = asString(item.query);
      return query ? { query } : null;
    }),
    related_precedents: asSimpleObjectArray(raw.related_precedents, (item) => {
      const caseName = asString(item.case_name);
      const caseNumber = asString(item.case_number);
      const reason = asString(item.reason);
      if (!caseName || !caseNumber || !reason) return null;
      return {
        case_name: caseName,
        case_number: caseNumber,
        reason,
        decision_date: asString(item.decision_date) ?? null,
        court_name: asString(item.court_name) ?? null
      };
    }),
    related_interpretations: asSimpleObjectArray(raw.related_interpretations, (item) => {
      const title = asString(item.title);
      const reason = asString(item.reason);
      if (!title || !reason) return null;
      return {
        title,
        reason,
        number: asString(item.number) ?? null,
        decision_date: asString(item.decision_date) ?? null,
        agency: asString(item.agency) ?? null
      };
    }),
    pros: asStringArray(raw.pros),
    cons: asStringArray(raw.cons),
    argument_strategy: asStringArray(raw.argument_strategy),
    counter_argument_points: asStringArray(raw.counter_argument_points),
    confidence_score: asNumber(raw.confidence_score),
    confidence_label: asString(raw.confidence_label),
    sync_ready: typeof raw.sync_ready === "boolean" ? raw.sync_ready : undefined,
    match_reason: asString(raw.match_reason),
    practitioner_brief: asStringArray(raw.practitioner_brief),
    training_notes: asStringArray(raw.training_notes),
    client_ready_summary: asStringArray(raw.client_ready_summary),
    practice_playbook: asStringArray(raw.practice_playbook),
    priority_actions: asStringArray(raw.priority_actions),
    risk_flags: asStringArray(raw.risk_flags),
    practical_use_status: asString(raw.practical_use_status),
    review_required_reasons: asStringArray(raw.review_required_reasons),
    critical_missing_facts: asStringArray(raw.critical_missing_facts),
    intent_notes: asStringArray(raw.intent_notes),
    subtype_notes: asStringArray(raw.subtype_notes),
    research_goal: asString(raw.research_goal),
    research_tracks: asStringArray(raw.research_tracks),
    authority_path: asStringArray(raw.authority_path),
    initial_checkpoints: asStringArray(raw.initial_checkpoints),
    practical_checklist: asStringArray(raw.practical_checklist),
    document_checklist: asStringArray(raw.document_checklist),
    study_guide: asStringArray(raw.study_guide),
    playbook_legal_bases: asStringArray(raw.playbook_legal_bases),
    supplemental_source_highlights: asStringArray(raw.supplemental_source_highlights),
    source_connection_notes: asStringArray(raw.source_connection_notes),
    common_failure_points: asStringArray(raw.common_failure_points),
    followup_narrow_questions: asStringArray(raw.followup_narrow_questions),
    visa_specific_guidance: asStringArray(raw.visa_specific_guidance),
    visa_scenario_guidance: asStringArray(raw.visa_scenario_guidance),
    admin_appeal_deep_guidance: asStringArray(raw.admin_appeal_deep_guidance),
    admin_appeal_timeline_guidance: asStringArray(raw.admin_appeal_timeline_guidance),
    licensing_industry_guidance: asStringArray(raw.licensing_industry_guidance),
    licensing_sector_deep_guidance: asStringArray(raw.licensing_sector_deep_guidance),
    domain_overview_notes: asStringArray(raw.domain_overview_notes),
    matched_laws: Array.isArray(raw.matched_laws) ? (raw.matched_laws as LawbotResponse["matched_laws"]) : undefined,
    matched_articles: Array.isArray(raw.matched_articles) ? (raw.matched_articles as LawbotResponse["matched_articles"]) : undefined,
    matched_precedents: Array.isArray(raw.matched_precedents)
      ? (raw.matched_precedents as LawbotResponse["matched_precedents"])
      : undefined,
    matched_interpretations: Array.isArray(raw.matched_interpretations)
      ? (raw.matched_interpretations as LawbotResponse["matched_interpretations"])
      : undefined,
    question_intents: Array.isArray(raw.question_intents) ? (raw.question_intents as LawbotResponse["question_intents"]) : undefined,
    domain_routes: Array.isArray(raw.domain_routes) ? (raw.domain_routes as LawbotResponse["domain_routes"]) : undefined,
    research_subtypes: Array.isArray(raw.research_subtypes)
      ? (raw.research_subtypes as LawbotResponse["research_subtypes"])
      : undefined,
    supplemental_sources: isRecord(raw.supplemental_sources)
      ? (raw.supplemental_sources as LawbotResponse["supplemental_sources"])
      : undefined,
    sync_payload: isRecord(raw.sync_payload) ? (raw.sync_payload as LawbotResponse["sync_payload"]) : undefined
  };

  return { ok: true, data: response };
}
