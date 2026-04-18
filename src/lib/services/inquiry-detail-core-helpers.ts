import {
  getLawbotCaseAnalysis,
  type StoredLawbotSnapshot
} from "@/lib/services/lawbot-case-analysis-service";
import { parseStructuredOperationsMemo } from "@/lib/services/operations-memo";
import {
  formatCompareList,
  findMemoLine,
  hasListChanged
} from "@/lib/services/inquiry-detail-core-utils";
import type {
  CaseTimelineItem,
  LawbotLiveAnalysis,
  LawbotOperationalSource,
  OperationsFeedItem,
  SnapshotCompareField,
  SnapshotCompareResult
} from "@/lib/services/inquiry-detail-core-types";
import { formatDateTime } from "@/lib/utils";

export { getWorkflowStep } from "@/lib/services/inquiry-detail-workflow-helpers";
export { buildStatusHistoryFromLogs } from "@/lib/services/inquiry-detail-status-history-helpers";
export type {
  CommunicationLogLike,
  StatusHistoryItem,
  WorkflowStep
} from "@/lib/services/inquiry-detail-core-types";

type LawbotAnalysis = Awaited<ReturnType<typeof getLawbotCaseAnalysis>>;

export function buildOperationsFeed(input: {
  createdAt: Date;
  updatedAt: Date;
  statusLabel: string;
  quoteStatus?: string | null;
  caseStage?: string | null;
  lawbotStatus: string;
  lawbotSnapshotStatus?: string | null;
  dueDate?: Date | null;
  internalMemo?: string | null;
}): OperationsFeedItem[] {
  const structuredMemo = parseStructuredOperationsMemo(input.internalMemo);
  const memoBodyLines =
    structuredMemo?.body
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean) ?? [];

  const recommendedRouteLine =
    structuredMemo?.metadata.recommendationLabel
      ? `Recommended route: ${structuredMemo.metadata.recommendationLabel}`
      : findMemoLine(input.internalMemo, ["Recommended route:", "Route:"]);
  const recommendedReasonLine =
    structuredMemo?.metadata.recommendationReason
      ? `Recommended reason: ${structuredMemo.metadata.recommendationReason}`
      : findMemoLine(input.internalMemo, ["Recommended reason:", "Reason:"]);

  const feed: OperationsFeedItem[] = [
    {
      label: "Inquiry created",
      description: "The client inquiry was registered with initial summary and diagnosis signals.",
      timestamp: formatDateTime(input.createdAt)
    },
    {
      label: "Current status",
      description: `Current operational status is ${input.statusLabel}.`,
      timestamp: formatDateTime(input.updatedAt)
    }
  ];

  if (input.lawbotStatus === "available") {
    feed.push({
      label: "Lawbot live analysis",
      description: "Law and practice checkpoints were refreshed from live Lawbot data.",
      timestamp: formatDateTime(input.updatedAt)
    });
  } else if (input.lawbotSnapshotStatus) {
    feed.push({
      label: "Lawbot snapshot fallback",
      description: `Live analysis was unavailable, so snapshot status (${input.lawbotSnapshotStatus}) was used.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.quoteStatus) {
    feed.push({
      label: "Quote workflow",
      description: `Quote status has progressed to ${input.quoteStatus}.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.caseStage) {
    feed.push({
      label: "Case stage",
      description: `Case stage is currently ${input.caseStage}.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.dueDate) {
    feed.push({
      label: "Due date",
      description: `A due date is set for ${formatDateTime(input.dueDate)}.`,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (input.internalMemo?.includes("[AUTO ACTION]")) {
    const memoSummary =
      structuredMemo?.metadata.summary ??
      memoBodyLines.find(
        (line) =>
          !line.startsWith("[AUTO ACTION]") &&
          !line.startsWith("Recommended route:") &&
          !line.startsWith("Recommended reason:")
      ) ??
      "Latest recommended action memo has been recorded.";

    feed.push({
      label: "Recommended action memo",
      description: memoSummary,
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  if (recommendedRouteLine || recommendedReasonLine) {
    feed.push({
      label: "Route decision recorded",
      description: [recommendedRouteLine, recommendedReasonLine].filter(Boolean).join(" / "),
      timestamp: formatDateTime(input.updatedAt)
    });
  }

  return feed;
}

export function buildCaseTimeline(input: {
  createdAt: Date;
  updatedAt: Date;
  inquiryStatusLabel: string;
  workflowStep: string;
  lawbotStatus: string;
  lawbotSnapshotStatus?: string | null;
  routeRecommendationLabel: string;
  routeRecommendationReason: string;
  quoteStatus?: string | null;
  caseStage?: string | null;
  dueDate?: Date | null;
  internalMemo?: string | null;
}): CaseTimelineItem[] {
  const workflowStepLabels: Record<string, string> = {
    RECEIVED: "Received",
    ANALYZED: "Analyzed",
    QUOTING: "Quoting",
    CONTRACT: "Contract",
    CASEWORK: "Casework",
    CLOSED: "Closed"
  };

  const items: CaseTimelineItem[] = [
    {
      title: "Inquiry received",
      description: "The inquiry was created and baseline context was captured.",
      timestamp: formatDateTime(input.createdAt),
      tone: "primary",
      emphasis: `Status: ${input.inquiryStatusLabel}`
    },
    {
      title: "Operational route decided",
      description: `Current route is ${input.routeRecommendationLabel}. ${input.routeRecommendationReason}`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "primary",
      emphasis: `Workflow step: ${workflowStepLabels[input.workflowStep] ?? input.workflowStep}`
    }
  ];

  if (input.lawbotStatus === "available") {
    items.push({
      title: "Lawbot live sync",
      description: "Timeline reflects the latest live Lawbot analysis.",
      timestamp: formatDateTime(input.updatedAt),
      tone: "success"
    });
  } else if (input.lawbotSnapshotStatus) {
    items.push({
      title: "Lawbot snapshot fallback",
      description: `Live connection unavailable; snapshot (${input.lawbotSnapshotStatus}) is being used.`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "warning"
    });
  }

  if (input.internalMemo?.includes("[AUTO ACTION]")) {
    items.push({
      title: "Auto action recorded",
      description: "Auto action memo has been stored and linked to follow-up workflow.",
      timestamp: formatDateTime(input.updatedAt),
      tone: "success"
    });
  }

  if (input.quoteStatus) {
    items.push({
      title: "Quote workspace updated",
      description: `Quote status is now ${input.quoteStatus}.`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "default"
    });
  }

  if (input.caseStage) {
    items.push({
      title: "Case stage updated",
      description: `Case stage is now ${input.caseStage}.`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "default"
    });
  }

  if (input.dueDate) {
    items.push({
      title: "Due date confirmed",
      description: `Due date is ${formatDateTime(input.dueDate)}.`,
      timestamp: formatDateTime(input.updatedAt),
      tone: "warning"
    });
  }

  return items;
}

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
  liveAnalysis: LawbotAnalysis;
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
