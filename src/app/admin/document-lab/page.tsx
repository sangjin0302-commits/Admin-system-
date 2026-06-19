import {
  buildDocumentTemplateFilterHref,
  buildDocumentTemplateReadiness,
  buildDocumentTemplateReadinessSummary,
  buildDocumentTemplateSourceVerificationPriority,
  buildDocumentTemplateSourceVerificationWorkQueueReasonFilterOptions,
  buildDocumentTemplateSourceVerificationWorkQueue,
  buildDocumentTemplateSourceStatusFilterOptions,
  filterDocumentTemplateSourceVerificationWorkQueue,
  filterDocumentTemplateInventory,
  getDocumentTemplateOfficialSourceStatus,
  groupDocumentTemplatesByCategory,
  listDocumentTemplateInventory,
  normalizeDocumentTemplateInventoryFilters,
  type DocumentTemplateOfficialSourceStatus
} from "@/lib/document-templates";

import { FooterSections } from "./_components/FooterSections";
import { InventorySection } from "./_components/InventorySection";
import { PageHeader } from "./_components/PageHeader";
import { PipelineOverview } from "./_components/PipelineOverview";
import { SourcePrioritySection } from "./_components/SourcePrioritySection";
import { SummaryStats } from "./_components/SummaryStats";
import { WorkQueueSection } from "./_components/WorkQueueSection";

export const dynamic = "force-dynamic";

export default async function AdminDocumentLabPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const templates = listDocumentTemplateInventory();
  const filters = normalizeDocumentTemplateInventoryFilters(params);
  const filteredTemplates = filterDocumentTemplateInventory(templates, filters);
  const groupedTemplates = groupDocumentTemplatesByCategory(filteredTemplates);
  const sourceStatusFilterOptions = buildDocumentTemplateSourceStatusFilterOptions(templates, filters);
  const readinessSummary = buildDocumentTemplateReadinessSummary(templates);
  const sourcePrioritySummary = buildDocumentTemplateSourceVerificationPriority(templates);
  const sourceVerificationWorkQueueBase = buildDocumentTemplateSourceVerificationWorkQueue(filteredTemplates, 50);
  const sourceVerificationWorkQueue = filterDocumentTemplateSourceVerificationWorkQueue(
    sourceVerificationWorkQueueBase,
    filters.missingReason
  ).slice(0, 8);
  const missingReasonFilterOptions = buildDocumentTemplateSourceVerificationWorkQueueReasonFilterOptions(
    sourceVerificationWorkQueueBase,
    filters.missingReason,
    (missingReason) => buildDocumentTemplateFilterHref(filters, { missingReason })
  );
  const readinessByTemplateId = new Map(
    filteredTemplates.map((template) => [template.id, buildDocumentTemplateReadiness(template)])
  );
  const officialSourceStatusSummary = templates.reduce(
    (summary, template) => {
      const status = getDocumentTemplateOfficialSourceStatus(template);
      summary[status] += 1;
      return summary;
    },
    { verified: 0, pending: 0, needs_review: 0, manual_only: 0 } satisfies Record<
      DocumentTemplateOfficialSourceStatus,
      number
    >
  );

  return (
    <div className="space-y-6">
      <PageHeader />
      <SummaryStats
        readinessSummary={readinessSummary}
        officialSourceStatusSummary={officialSourceStatusSummary}
      />
      <SourcePrioritySection filters={filters} sourcePrioritySummary={sourcePrioritySummary} />
      <WorkQueueSection
        filters={filters}
        sourceVerificationWorkQueue={sourceVerificationWorkQueue}
        missingReasonFilterOptions={missingReasonFilterOptions}
      />
      <PipelineOverview />
      <InventorySection
        filters={filters}
        templates={templates}
        filteredTemplates={filteredTemplates}
        groupedTemplates={groupedTemplates}
        readinessByTemplateId={readinessByTemplateId}
        sourceStatusFilterOptions={sourceStatusFilterOptions}
      />
      <FooterSections />
    </div>
  );
}
