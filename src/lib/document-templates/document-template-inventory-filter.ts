import {
  documentTemplateInventory,
  getDocumentTemplateOfficialSourceStatus,
  getDocumentTemplateOfficialSourceStatusLabel,
  type DocumentTemplateCategory,
  type DocumentTemplateConversionStatus,
  type DocumentTemplateInventoryItem,
  type DocumentTemplateOfficialSourceStatus,
  type DocumentTemplateRiskLevel
} from "./document-template-inventory";
import type { DocumentTemplateSourceVerificationWorkQueueReasonId } from "./document-template-source-priority";

export type DocumentTemplateSourceStatusFilter = DocumentTemplateOfficialSourceStatus;
export type DocumentTemplateMissingReasonFilter = DocumentTemplateSourceVerificationWorkQueueReasonId;

export type DocumentTemplateInventoryFilters = {
  category: DocumentTemplateCategory | null;
  risk: DocumentTemplateRiskLevel | null;
  conversionStatus: DocumentTemplateConversionStatus | null;
  sourceStatus: DocumentTemplateSourceStatusFilter | null;
  missingReason: DocumentTemplateMissingReasonFilter | null;
  q: string | null;
};

export type DocumentTemplateSourceStatusFilterOption = {
  sourceStatus: DocumentTemplateSourceStatusFilter | null;
  labelKo: string;
  count: number;
  href: string;
  isActive: boolean;
};

export const allDocumentTemplateCategoryValues = [
  "common",
  "administrative_appeal",
  "immigration",
  "information_disclosure",
  "driver_license",
  "general_statement"
] satisfies DocumentTemplateCategory[];

export const allDocumentTemplateRiskValues = ["low", "medium", "high"] satisfies DocumentTemplateRiskLevel[];

export const allDocumentTemplateConversionStatusValues = [
  "not_started",
  "source_collected",
  "official_verified",
  "conversion_testing",
  "template_candidate",
  "verified",
  "manual_only"
] satisfies DocumentTemplateConversionStatus[];

export const allDocumentTemplateSourceStatusValues = [
  "verified",
  "needs_review",
  "pending",
  "manual_only"
] satisfies DocumentTemplateSourceStatusFilter[];

export const allDocumentTemplateMissingReasonValues = [
  "official_source_missing",
  "latest_verified_at_missing",
  "verified_by_missing",
  "verification_memo_missing",
  "high_risk_review_needed",
  "manual_only_review"
] satisfies DocumentTemplateMissingReasonFilter[];

function pickParam(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isDocumentTemplateCategory(value: string | null | undefined): value is DocumentTemplateCategory {
  return allDocumentTemplateCategoryValues.includes(value as DocumentTemplateCategory);
}

function isDocumentTemplateRisk(value: string | null | undefined): value is DocumentTemplateRiskLevel {
  return allDocumentTemplateRiskValues.includes(value as DocumentTemplateRiskLevel);
}

function isDocumentTemplateConversionStatus(
  value: string | null | undefined
): value is DocumentTemplateConversionStatus {
  return allDocumentTemplateConversionStatusValues.includes(value as DocumentTemplateConversionStatus);
}

function isDocumentTemplateSourceStatus(
  value: string | null | undefined
): value is DocumentTemplateSourceStatusFilter {
  return allDocumentTemplateSourceStatusValues.includes(value as DocumentTemplateSourceStatusFilter);
}

function isDocumentTemplateMissingReason(
  value: string | null | undefined
): value is DocumentTemplateMissingReasonFilter {
  return allDocumentTemplateMissingReasonValues.includes(value as DocumentTemplateMissingReasonFilter);
}

export function listDocumentTemplateCategories() {
  return [...allDocumentTemplateCategoryValues];
}

export function listDocumentTemplateRiskLevels() {
  return [...allDocumentTemplateRiskValues];
}

export function listDocumentTemplateConversionStatuses() {
  return [...allDocumentTemplateConversionStatusValues];
}

export function listDocumentTemplateSourceStatuses() {
  return [...allDocumentTemplateSourceStatusValues];
}

export function listDocumentTemplateMissingReasons() {
  return [...allDocumentTemplateMissingReasonValues];
}

export function normalizeDocumentTemplateInventoryFilters(
  searchParams: Record<string, string | string[] | null | undefined> = {}
): DocumentTemplateInventoryFilters {
  const category = pickParam(searchParams.category);
  const risk = pickParam(searchParams.risk);
  const conversionStatus = pickParam(searchParams.conversionStatus);
  const sourceStatus = pickParam(searchParams.sourceStatus);
  const missingReason = pickParam(searchParams.missingReason);
  const q = pickParam(searchParams.q)?.trim() || null;

  return {
    category: isDocumentTemplateCategory(category) ? category : null,
    risk: isDocumentTemplateRisk(risk) ? risk : null,
    conversionStatus: isDocumentTemplateConversionStatus(conversionStatus) ? conversionStatus : null,
    sourceStatus: isDocumentTemplateSourceStatus(sourceStatus) ? sourceStatus : null,
    missingReason: isDocumentTemplateMissingReason(missingReason) ? missingReason : null,
    q
  };
}

export function filterDocumentTemplateInventory(
  items: DocumentTemplateInventoryItem[] = documentTemplateInventory,
  filters: DocumentTemplateInventoryFilters
) {
  const query = filters.q?.toLocaleLowerCase("ko-KR") ?? null;

  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.risk && item.riskLevel !== filters.risk) return false;
    if (filters.conversionStatus && item.conversionStatus !== filters.conversionStatus) return false;
    if (filters.sourceStatus && getDocumentTemplateOfficialSourceStatus(item) !== filters.sourceStatus) return false;
    if (!query) return true;

    return [item.titleKo, item.id, item.officialSourceName]
      .join(" ")
      .toLocaleLowerCase("ko-KR")
      .includes(query);
  });
}

export function countDocumentTemplatesBySourceStatus(
  items: DocumentTemplateInventoryItem[] = documentTemplateInventory,
  filters: DocumentTemplateInventoryFilters
): Record<DocumentTemplateSourceStatusFilter | "all", number> {
  const baseItems = filterDocumentTemplateInventory(items, { ...filters, sourceStatus: null });
  const counts = {
    all: baseItems.length,
    verified: 0,
    needs_review: 0,
    pending: 0,
    manual_only: 0
  } satisfies Record<DocumentTemplateSourceStatusFilter | "all", number>;

  for (const item of baseItems) {
    counts[getDocumentTemplateOfficialSourceStatus(item)] += 1;
  }

  return counts;
}

export function buildDocumentTemplateSourceStatusFilterOptions(
  items: DocumentTemplateInventoryItem[] = documentTemplateInventory,
  filters: DocumentTemplateInventoryFilters
): DocumentTemplateSourceStatusFilterOption[] {
  const counts = countDocumentTemplatesBySourceStatus(items, filters);
  return [
    {
      sourceStatus: null,
      labelKo: "전체 source status",
      count: counts.all,
      href: buildDocumentTemplateFilterHref(filters, { sourceStatus: null }),
      isActive: filters.sourceStatus === null
    },
    ...listDocumentTemplateSourceStatuses().map((sourceStatus) => ({
      sourceStatus,
      labelKo: getDocumentTemplateOfficialSourceStatusLabel(sourceStatus),
      count: counts[sourceStatus],
      href: buildDocumentTemplateFilterHref(filters, { sourceStatus }),
      isActive: filters.sourceStatus === sourceStatus
    }))
  ];
}

export function groupDocumentTemplatesByCategory(items: DocumentTemplateInventoryItem[]) {
  return listDocumentTemplateCategories()
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category)
    }))
    .filter((group) => group.items.length > 0);
}

export function buildDocumentTemplateFilterHref(
  filters: DocumentTemplateInventoryFilters,
  updates: Partial<DocumentTemplateInventoryFilters>
) {
  const nextFilters = { ...filters, ...updates };
  const params = new URLSearchParams();
  if (nextFilters.category) params.set("category", nextFilters.category);
  if (nextFilters.risk) params.set("risk", nextFilters.risk);
  if (nextFilters.conversionStatus) params.set("conversionStatus", nextFilters.conversionStatus);
  if (nextFilters.sourceStatus) params.set("sourceStatus", nextFilters.sourceStatus);
  if (nextFilters.missingReason) params.set("missingReason", nextFilters.missingReason);
  if (nextFilters.q) params.set("q", nextFilters.q);
  const query = params.toString();
  return query ? `/admin/document-lab?${query}` : "/admin/document-lab";
}
