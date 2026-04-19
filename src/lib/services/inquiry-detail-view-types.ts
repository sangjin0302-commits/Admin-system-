import type { InquiryStatus } from "@/types/inquiry";

export type StrengthLabel = "강함" | "보통" | "주의" | "불리";

export type DetailRiskHighlight = {
  title: string;
  description: string;
  tone: "danger" | "warning" | "info";
};

export type MockMarketAnalyzeSignal = {
  status: string;
  summary: string;
  demandScore: number;
  responseTempoKey: "docs-first" | "consult-first" | "fast-response";
  routeBias: "review" | "consult" | "quote";
  metrics: { label: string; value: string }[];
  highlights: string[];
};

export type RouteRecommendation = {
  recommendedStatus: InquiryStatus;
  recommendationLabel: string;
  recommendationReason: string;
  orderedStatuses: InquiryStatus[];
};
