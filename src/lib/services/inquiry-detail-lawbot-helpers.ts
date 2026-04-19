import type { StoredLawbotSnapshot } from "@/lib/services/lawbot-case-analysis-service";
import {
  formatCompareList,
  hasListChanged
} from "@/lib/services/inquiry-detail-core-utils";
import type {
  LawbotLiveAnalysis,
  LawbotOperationalSource,
  SnapshotCompareField,
  SnapshotCompareResult
} from "@/lib/services/inquiry-detail-core-types";

export function buildLawbotSnapshotComparison(input: {
  liveAnalysis: LawbotLiveAnalysis;
  storedSnapshot: StoredLawbotSnapshot | null;
}): SnapshotCompareResult {
  if (!input.storedSnapshot?.payload) {
    return {
      headline: "Lawbot snapshot comparison setup",
      description: "No previous snapshot exists. The next successful run will establish a baseline.",
      fields: [
        {
          label: "Previous snapshot",
          previous: "none",
          current: input.liveAnalysis.status === "available" ? "live result available" : "live result pending",
          changed: input.liveAnalysis.status === "available"
        }
      ]
    };
  }

  if (input.liveAnalysis.status !== "available") {
    return {
      headline: "Lawbot snapshot comparison",
      description: "Live Lawbot analysis is unavailable, so comparison is based on the latest stored snapshot.",
      fields: [
        {
          label: "Comparison mode",
          previous: input.storedSnapshot.summary ?? "stored summary unavailable",
          current: "live result pending",
          changed: false
        }
      ]
    };
  }

  const current = input.liveAnalysis.data;
  const previous = input.storedSnapshot.payload;

  const fields: SnapshotCompareField[] = [
    {
      label: "Practical use status",
      previous: previous.practical_use_status ?? "none",
      current: current.practical_use_status ?? "none",
      changed: (previous.practical_use_status ?? "") !== (current.practical_use_status ?? "")
    },
    {
      label: "Research goal",
      previous: previous.research_goal ?? "none",
      current: current.research_goal ?? "none",
      changed: (previous.research_goal ?? "") !== (current.research_goal ?? "")
    },
    {
      label: "Review required reasons",
      previous: formatCompareList(previous.review_required_reasons),
      current: formatCompareList(current.review_required_reasons),
      changed: hasListChanged(previous.review_required_reasons, current.review_required_reasons)
    },
    {
      label: "Critical missing facts",
      previous: formatCompareList(previous.critical_missing_facts),
      current: formatCompareList(current.critical_missing_facts),
      changed: hasListChanged(previous.critical_missing_facts, current.critical_missing_facts)
    },
    {
      label: "Document checklist",
      previous: formatCompareList(previous.document_checklist),
      current: formatCompareList(current.document_checklist),
      changed: hasListChanged(previous.document_checklist, current.document_checklist)
    },
    {
      label: "Priority actions",
      previous: formatCompareList(previous.priority_actions),
      current: formatCompareList(current.priority_actions),
      changed: hasListChanged(previous.priority_actions, current.priority_actions)
    }
  ];

  return {
    headline: "Lawbot snapshot comparison",
    description: "Shows key changes between the latest stored snapshot and the current live analysis.",
    fields
  };
}

export function getLawbotOperationalSource(input: {
  lawbotStatus: string;
  liveAnalysis: LawbotLiveAnalysis;
  storedSnapshot: StoredLawbotSnapshot | null;
}): LawbotOperationalSource {
  if (input.lawbotStatus === "available" && input.liveAnalysis.status === "available") {
    const data = input.liveAnalysis.data;
    return {
      sourceLabel: "Live Lawbot result",
      practicalUseStatus: data.practical_use_status ?? null,
      summary: data.client_ready_summary?.[0] ?? data.practitioner_brief?.[0] ?? data.input_summary,
      priorityActions: data.priority_actions ?? [],
      missingFacts: data.critical_missing_facts ?? [],
      documentChecklist: data.document_checklist ?? [],
      reviewReasons: data.review_required_reasons ?? [],
      riskFlags: data.risk_flags ?? []
    };
  }

  if (input.storedSnapshot?.payload) {
    return {
      sourceLabel: "Stored Lawbot snapshot",
      practicalUseStatus: input.storedSnapshot.payload.practical_use_status ?? null,
      summary:
        input.storedSnapshot.summary ??
        input.storedSnapshot.payload.input_summary ??
        "stored summary unavailable",
      priorityActions: input.storedSnapshot.payload.priority_actions ?? [],
      missingFacts: input.storedSnapshot.payload.critical_missing_facts ?? [],
      documentChecklist: input.storedSnapshot.payload.document_checklist ?? [],
      reviewReasons: input.storedSnapshot.payload.review_required_reasons ?? [],
      riskFlags: input.storedSnapshot.payload.risk_flags ?? []
    };
  }

  return {
    sourceLabel: "Lawbot disconnected",
    practicalUseStatus: null,
    summary: null,
    priorityActions: [],
    missingFacts: [],
    documentChecklist: [],
    reviewReasons: [],
    riskFlags: []
  };
}
