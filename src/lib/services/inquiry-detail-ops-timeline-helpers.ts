import { parseStructuredOperationsMemo } from "@/lib/services/operations-memo";
import { findMemoLine } from "@/lib/services/inquiry-detail-core-utils";
import type {
  CaseTimelineItem,
  OperationsFeedItem
} from "@/lib/services/inquiry-detail-core-types";
import { formatDateTime } from "@/lib/utils";

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
