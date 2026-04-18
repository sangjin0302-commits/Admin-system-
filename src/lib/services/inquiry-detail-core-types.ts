import type { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";

export type LawbotLiveAnalysis = Awaited<ReturnType<typeof getLawbotCaseAnalysis>>;

export type WorkflowStep = "RECEIVED" | "ANALYZED" | "QUOTING" | "CONTRACT" | "CASEWORK" | "CLOSED";

export type CommunicationLogLike = {
  id: string;
  createdAt: string;
  channel: string;
  summary: string;
  details: string;
};

export type OperationsFeedItem = {
  label: string;
  description: string;
  timestamp: string;
};

export type CaseTimelineItem = {
  title: string;
  description: string;
  timestamp: string;
  tone?: "default" | "success" | "warning" | "primary";
  emphasis?: string;
};

export type StatusHistoryItem = {
  id: string;
  createdAt: string;
  previousStatusLabel: string;
  nextStatusLabel: string;
  reason: string | null;
  source: string | null;
};

export type SnapshotCompareField = {
  label: string;
  previous: string;
  current: string;
  changed: boolean;
};

export type SnapshotCompareResult = {
  headline: string;
  description: string;
  fields: SnapshotCompareField[];
};

export type LawbotOperationalSource = {
  sourceLabel: string;
  practicalUseStatus: string | null;
  summary: string | null;
  priorityActions: string[];
  missingFacts: string[];
  documentChecklist: string[];
  reviewReasons: string[];
  riskFlags: string[];
};
