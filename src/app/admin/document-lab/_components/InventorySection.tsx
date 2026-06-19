import Link from "next/link";
import { Fragment } from "react";

import { Card } from "@/components/ui/card";
import {
  buildDocumentTemplateFilterHref,
  buildDocumentTemplateReadiness,
  buildDocumentTemplateSourceStatusFilterOptions,
  getDocumentTemplateCategoryLabel,
  getDocumentTemplateConversionStatusLabel,
  getDocumentTemplateOfficialSourceStatus,
  getDocumentTemplateOfficialSourceStatusLabel,
  getDocumentTemplateReadinessStatusLabel,
  getDocumentTemplateRiskLabel,
  groupDocumentTemplatesByCategory,
  listDocumentTemplateCategories,
  listDocumentTemplateConversionStatuses,
  listDocumentTemplateRiskLevels,
  normalizeDocumentTemplateInventoryFilters,
  type DocumentTemplateInventoryItem
} from "@/lib/document-templates";

import {
  filterLinkClassName,
  formatCanonicalFormats,
  formatDate,
  formatOptionalText,
  officialSourceStatusClassName,
  readinessStatusClassName,
  riskClassName
} from "./styles";

type Filters = ReturnType<typeof normalizeDocumentTemplateInventoryFilters>;
type SourceStatusFilterOptions = ReturnType<typeof buildDocumentTemplateSourceStatusFilterOptions>;

export function InventorySection({
  filters,
  templates,
  filteredTemplates,
  groupedTemplates,
  readinessByTemplateId,
  sourceStatusFilterOptions
}: {
  filters: Filters;
  templates: DocumentTemplateInventoryItem[];
  filteredTemplates: DocumentTemplateInventoryItem[];
  groupedTemplates: ReturnType<typeof groupDocumentTemplatesByCategory>;
  readinessByTemplateId: Map<string, ReturnType<typeof buildDocumentTemplateReadiness>>;
  sourceStatusFilterOptions: SourceStatusFilterOptions;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2">
        <p className="ui-kicker">Template inventory</p>
        <h3 className="ui-section-title">read-only inventory</h3>
        <p className="text-sm text-text-muted">
          실제 파일 path나 고객 데이터 없이 후보 서식의 상태만 표시합니다.
        </p>
      </div>

      <div className="mt-5 space-y-4 rounded-2xl border border-line bg-surface-muted p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-strong">Inventory filters</p>
            <p className="text-xs text-text-muted">
              {templates.length}개 중 {filteredTemplates.length}개 표시
            </p>
          </div>
          <form action="/admin/document-lab" className="flex flex-col gap-2 sm:flex-row">
            {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
            {filters.risk ? <input type="hidden" name="risk" value={filters.risk} /> : null}
            {filters.conversionStatus ? (
              <input type="hidden" name="conversionStatus" value={filters.conversionStatus} />
            ) : null}
            {filters.sourceStatus ? <input type="hidden" name="sourceStatus" value={filters.sourceStatus} /> : null}
            {filters.missingReason ? (
              <input type="hidden" name="missingReason" value={filters.missingReason} />
            ) : null}
            <input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="서식명/ID/출처 검색"
              className="h-9 rounded-full border border-line bg-white px-3 text-sm text-text-strong"
            />
            <button
              type="submit"
              className="h-9 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong"
            >
              검색
            </button>
            <Link href="/admin/document-lab" className={filterLinkClassName(false)}>
              초기화
            </Link>
          </form>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildDocumentTemplateFilterHref(filters, { category: null })}
              className={filterLinkClassName(filters.category === null)}
            >
              전체 category
            </Link>
            {listDocumentTemplateCategories().map((category) => (
              <Link
                key={category}
                href={buildDocumentTemplateFilterHref(filters, { category })}
                className={filterLinkClassName(filters.category === category)}
              >
                {getDocumentTemplateCategoryLabel(category)}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildDocumentTemplateFilterHref(filters, { risk: null })}
              className={filterLinkClassName(filters.risk === null)}
            >
              전체 risk
            </Link>
            {listDocumentTemplateRiskLevels().map((risk) => (
              <Link
                key={risk}
                href={buildDocumentTemplateFilterHref(filters, { risk })}
                className={filterLinkClassName(filters.risk === risk)}
              >
                {getDocumentTemplateRiskLabel(risk)}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildDocumentTemplateFilterHref(filters, { conversionStatus: null })}
              className={filterLinkClassName(filters.conversionStatus === null)}
            >
              전체 conversion status
            </Link>
            {listDocumentTemplateConversionStatuses().map((conversionStatus) => (
              <Link
                key={conversionStatus}
                href={buildDocumentTemplateFilterHref(filters, { conversionStatus })}
                className={filterLinkClassName(filters.conversionStatus === conversionStatus)}
              >
                {getDocumentTemplateConversionStatusLabel(conversionStatus)}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {sourceStatusFilterOptions.map((option) => (
              <Link
                key={option.sourceStatus ?? "all"}
                href={option.href}
                className={filterLinkClassName(option.isActive)}
              >
                <span>{option.labelKo}</span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${
                    option.isActive ? "bg-white/20 text-white" : "bg-surface text-text-muted"
                  }`}
                >
                  {option.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card muted className="mt-5 p-5">
          <p className="text-sm font-semibold text-text-strong">조건에 맞는 서식이 없습니다.</p>
          <p className="mt-2 text-sm text-text-muted">필터를 초기화하거나 다른 검색어를 사용하세요.</p>
        </Card>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-left text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              <th className="px-3 py-3">서식</th>
              <th className="px-3 py-3">분류</th>
              <th className="px-3 py-3">원본</th>
              <th className="px-3 py-3">후보 포맷</th>
              <th className="px-3 py-3">변환 상태</th>
              <th className="px-3 py-3">준비 상태</th>
              <th className="px-3 py-3">체크리스트</th>
              <th className="px-3 py-3">출처 검증</th>
              <th className="px-3 py-3">위험도</th>
              <th className="px-3 py-3">필수값</th>
              <th className="px-3 py-3">공식 출처</th>
              <th className="px-3 py-3">최신 확인일</th>
              <th className="px-3 py-3">확인자</th>
              <th className="px-3 py-3">검토 메모</th>
              <th className="px-3 py-3">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {groupedTemplates.map((group) => (
              <Fragment key={group.category}>
                <tr className="bg-surface-muted">
                  <td colSpan={15} className="px-3 py-2 text-xs font-semibold text-text-strong">
                    {getDocumentTemplateCategoryLabel(group.category)} ({group.items.length})
                  </td>
                </tr>
                {group.items.map((template) => {
                  const readiness = readinessByTemplateId.get(template.id) ?? buildDocumentTemplateReadiness(template);
                  const officialSourceStatus = getDocumentTemplateOfficialSourceStatus(template);
                  const missingCheckLabels = readiness.missingRequiredChecks
                    .slice(0, 3)
                    .map((check) => check.labelKo)
                    .join(", ");

                  return (
                    <tr key={template.id} className="align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-text-strong">{template.titleKo}</p>
                        <p className="mt-1 text-xs text-text-muted">{template.id}</p>
                      </td>
                      <td className="px-3 py-3 text-text-muted">
                        {getDocumentTemplateCategoryLabel(template.category)}
                      </td>
                      <td className="px-3 py-3 text-text-muted">{template.sourceFormat.toUpperCase()}</td>
                      <td className="px-3 py-3 text-text-muted">{formatCanonicalFormats(template)}</td>
                      <td className="px-3 py-3 text-text-muted">
                        {getDocumentTemplateConversionStatusLabel(template.conversionStatus)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                            readinessStatusClassName[readiness.status]
                          }`}
                        >
                          {getDocumentTemplateReadinessStatusLabel(readiness.status)}
                        </span>
                        {readiness.warnings.length > 0 ? (
                          <p className="mt-1 text-xs text-text-muted">{readiness.warnings[0]}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-text-muted">
                        <p className="font-semibold text-text-strong">
                          필수 준비 {readiness.completedCount}/{readiness.requiredCount}
                        </p>
                        {missingCheckLabels ? (
                          <p className="mt-1 text-xs text-text-muted">부족: {missingCheckLabels}</p>
                        ) : (
                          <p className="mt-1 text-xs text-text-muted">필수 준비 항목 충족</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                            officialSourceStatusClassName[officialSourceStatus]
                          }`}
                        >
                          {getDocumentTemplateOfficialSourceStatusLabel(officialSourceStatus)}
                        </span>
                        {officialSourceStatus === "manual_only" ? (
                          <p className="mt-1 text-xs text-text-muted">manual-only</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${riskClassName[template.riskLevel]}`}
                        >
                          {getDocumentTemplateRiskLabel(template.riskLevel)}
                        </span>
                        {template.riskLevel === "high" ? (
                          <p className="mt-1 text-xs text-text-muted">admin review 필요</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-text-muted">{template.requiredFields.length}개</td>
                      <td className="px-3 py-3 text-text-muted">
                        <p>{template.officialSourceName || "공식 출처 미확인"}</p>
                        {template.officialSourceReferenceKo ? (
                          <p className="mt-1 text-xs text-text-muted">{template.officialSourceReferenceKo}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-text-muted">{formatDate(template.latestVerifiedAt)}</td>
                      <td className="px-3 py-3 text-text-muted">{formatOptionalText(template.verifiedBy)}</td>
                      <td className="max-w-xs px-3 py-3 text-text-muted">
                        {formatOptionalText(template.verificationMemoKo)}
                      </td>
                      <td className="max-w-xs px-3 py-3 text-text-muted">{template.notesKo}</td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
