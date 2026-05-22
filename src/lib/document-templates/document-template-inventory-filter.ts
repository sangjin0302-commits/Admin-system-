import {
  documentTemplateInventory,
  type DocumentTemplateCategory,
  type DocumentTemplateConversionStatus,
  type DocumentTemplateInventoryItem,
  type DocumentTemplateRiskLevel
} from "./document-template-inventory";

export type DocumentTemplateInventoryFilters = {
  category: DocumentTemplateCategory | null;
  risk: DocumentTemplateRiskLevel | null;
  conversionStatus: DocumentTemplateConversionStatus | null;
  q: string | null;
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

export function listDocumentTemplateCategories() {
  return [...allDocumentTemplateCategoryValues];
}

export function listDocumentTemplateRiskLevels() {
  return [...allDocumentTemplateRiskValues];
}

export function listDocumentTemplateConversionStatuses() {
  return [...allDocumentTemplateConversionStatusValues];
}

export function normalizeDocumentTemplateInventoryFilters(
  searchParams: Record<string, string | string[] | null | undefined> = {}
): DocumentTemplateInventoryFilters {
  const category = pickParam(searchParams.category);
  const risk = pickParam(searchParams.risk);
  const conversionStatus = pickParam(searchParams.conversionStatus);
  const q = pickParam(searchParams.q)?.trim() || null;

  return {
    category: isDocumentTemplateCategory(category) ? category : null,
    risk: isDocumentTemplateRisk(risk) ? risk : null,
    conversionStatus: isDocumentTemplateConversionStatus(conversionStatus) ? conversionStatus : null,
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
    if (!query) return true;

    return [item.titleKo, item.id, item.officialSourceName]
      .join(" ")
      .toLocaleLowerCase("ko-KR")
      .includes(query);
  });
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
  if (nextFilters.q) params.set("q", nextFilters.q);
  const query = params.toString();
  return query ? `/admin/document-lab?${query}` : "/admin/document-lab";
}
