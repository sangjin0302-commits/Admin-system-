import { toChecklistStringArray } from "@/lib/services/inquiry-checklist-state-list-helpers";
import type { ParsedLawbotOperationalSignals } from "@/lib/services/inquiry-checklist-state-types";

export function parseLawbotOperationalSignals(raw?: string | null): ParsedLawbotOperationalSignals {
  if (!raw) {
    return {
      reviewRequiredReasons: [],
      criticalMissingFacts: [],
      documentChecklist: []
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      review_required_reasons?: unknown;
      critical_missing_facts?: unknown;
      document_checklist?: unknown;
    };

    return {
      reviewRequiredReasons: toChecklistStringArray(parsed.review_required_reasons),
      criticalMissingFacts: toChecklistStringArray(parsed.critical_missing_facts),
      documentChecklist: toChecklistStringArray(parsed.document_checklist)
    };
  } catch {
    return {
      reviewRequiredReasons: [],
      criticalMissingFacts: [],
      documentChecklist: []
    };
  }
}
