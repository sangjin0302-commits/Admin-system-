import type {
  DocumentTemplateInventoryItem,
  DocumentTemplateOfficialSourceStatus,
  DocumentTemplateReadinessStatus,
  DocumentTemplateRiskLevel,
  DocumentTemplateSourceVerificationPriority
} from "@/lib/document-templates";

export const riskClassName = {
  low: "border-blue-200 bg-blue-50 text-blue-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-700"
} satisfies Record<DocumentTemplateRiskLevel, string>;

export const readinessStatusClassName = {
  not_started: "border-slate-200 bg-slate-50 text-slate-700",
  needs_source: "border-red-200 bg-red-50 text-red-700",
  needs_mapping: "border-amber-200 bg-amber-50 text-amber-800",
  needs_conversion_test: "border-orange-200 bg-orange-50 text-orange-800",
  needs_review: "border-purple-200 bg-purple-50 text-purple-700",
  ready_candidate: "border-emerald-200 bg-emerald-50 text-emerald-700",
  manual_only: "border-slate-200 bg-slate-50 text-slate-700"
} satisfies Record<DocumentTemplateReadinessStatus, string>;

export const officialSourceStatusClassName = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-slate-200 bg-slate-50 text-slate-700",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  manual_only: "border-slate-200 bg-slate-50 text-slate-700"
} satisfies Record<DocumentTemplateOfficialSourceStatus, string>;

export const sourcePriorityClassName = {
  urgent: "border-red-200 bg-red-50 text-red-700",
  high: "border-amber-200 bg-amber-50 text-amber-800",
  normal: "border-blue-200 bg-blue-50 text-blue-700",
  low: "border-slate-200 bg-slate-50 text-slate-700"
} satisfies Record<DocumentTemplateSourceVerificationPriority, string>;

export const sourceChecklistStatusClassName = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  missing: "border-slate-200 bg-slate-50 text-slate-700"
} satisfies Record<"complete" | "needs_review" | "missing", string>;

export const activeFilterClassName = "border-primary bg-primary text-white";
export const idleFilterClassName =
  "border-line bg-surface text-text hover:border-line-strong hover:bg-surface-muted";

export function formatDate(value: string | null) {
  return value ?? "미확인";
}

export function formatOptionalText(value: string | null | undefined) {
  return value?.trim() || "미확인";
}

export function formatCanonicalFormats(item: DocumentTemplateInventoryItem) {
  return item.canonicalFormatCandidate.map((format) => format.toUpperCase()).join(", ");
}

export function formatCompactChecklistValue(value: string) {
  return value.length > 34 ? `${value.slice(0, 34)}...` : value;
}

export function filterLinkClassName(active: boolean) {
  return `inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition ${
    active ? activeFilterClassName : idleFilterClassName
  }`;
}
