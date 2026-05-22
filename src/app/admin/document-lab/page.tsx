import Link from "next/link";
import { Fragment } from "react";

import { Card } from "@/components/ui/card";
import {
  buildDocumentTemplateFilterHref,
  buildDocumentTemplateReadiness,
  buildDocumentTemplateReadinessSummary,
  buildDocumentTemplateSourceVerificationPriority,
  buildDocumentTemplateSourceVerificationWorkQueue,
  buildDocumentTemplateSourceStatusFilterOptions,
  filterDocumentTemplateInventory,
  getDocumentTemplateCategoryLabel,
  getDocumentTemplateConversionStatusLabel,
  getDocumentTemplateOfficialSourceStatus,
  getDocumentTemplateOfficialSourceStatusLabel,
  getDocumentTemplateRiskLabel,
  getDocumentTemplateReadinessStatusLabel,
  groupDocumentTemplatesByCategory,
  listDocumentTemplateCategories,
  listDocumentTemplateConversionStatuses,
  listDocumentTemplateInventory,
  listDocumentTemplateRiskLevels,
  normalizeDocumentTemplateInventoryFilters,
  type DocumentTemplateInventoryItem,
  type DocumentTemplateOfficialSourceStatus,
  type DocumentTemplateReadinessStatus,
  type DocumentTemplateSourceVerificationPriority,
  type DocumentTemplateRiskLevel
} from "@/lib/document-templates";

export const dynamic = "force-dynamic";

const riskClassName = {
  low: "border-blue-200 bg-blue-50 text-blue-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-700"
} satisfies Record<DocumentTemplateRiskLevel, string>;

const readinessStatusClassName = {
  not_started: "border-slate-200 bg-slate-50 text-slate-700",
  needs_source: "border-red-200 bg-red-50 text-red-700",
  needs_mapping: "border-amber-200 bg-amber-50 text-amber-800",
  needs_conversion_test: "border-orange-200 bg-orange-50 text-orange-800",
  needs_review: "border-purple-200 bg-purple-50 text-purple-700",
  ready_candidate: "border-emerald-200 bg-emerald-50 text-emerald-700",
  manual_only: "border-slate-200 bg-slate-50 text-slate-700"
} satisfies Record<DocumentTemplateReadinessStatus, string>;

const officialSourceStatusClassName = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-slate-200 bg-slate-50 text-slate-700",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  manual_only: "border-slate-200 bg-slate-50 text-slate-700"
} satisfies Record<DocumentTemplateOfficialSourceStatus, string>;

const sourcePriorityClassName = {
  urgent: "border-red-200 bg-red-50 text-red-700",
  high: "border-amber-200 bg-amber-50 text-amber-800",
  normal: "border-blue-200 bg-blue-50 text-blue-700",
  low: "border-slate-200 bg-slate-50 text-slate-700"
} satisfies Record<DocumentTemplateSourceVerificationPriority, string>;

const sourceChecklistStatusClassName = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  missing: "border-slate-200 bg-slate-50 text-slate-700"
} satisfies Record<"complete" | "needs_review" | "missing", string>;

const activeFilterClassName = "border-primary bg-primary text-white";
const idleFilterClassName = "border-line bg-surface text-text hover:border-line-strong hover:bg-surface-muted";

function formatDate(value: string | null) {
  return value ?? "미확인";
}

function formatOptionalText(value: string | null | undefined) {
  return value?.trim() || "미확인";
}

function formatCanonicalFormats(item: DocumentTemplateInventoryItem) {
  return item.canonicalFormatCandidate.map((format) => format.toUpperCase()).join(", ");
}

function formatCompactChecklistValue(value: string) {
  return value.length > 34 ? `${value.slice(0, 34)}...` : value;
}

function filterLinkClassName(active: boolean) {
  return `inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition ${
    active ? activeFilterClassName : idleFilterClassName
  }`;
}

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
  const sourceVerificationWorkQueue = buildDocumentTemplateSourceVerificationWorkQueue(templates, 8);
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
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Admin-only document lab</p>
            <h2 className="mt-2 ui-page-title">문서 실험실</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              HWP/HWPX 공공서식 자동완성 파이프라인을 검증하기 위한 관리자 전용 실험 공간입니다.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
          >
            관리자 대시보드
          </Link>
        </div>
      </Card>

      <Card className="border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-900">현재는 read-only inventory 단계입니다.</p>
        <p className="mt-2 text-sm text-amber-900">
          문서 생성 없음, 다운로드 없음, 파일 업로드 없음, CaseMatter 연결 없음, 고객 발송 없음, 기관 제출 없음, AI 단독
          법률판단 없음. 공식 서식 최신성 확인 필요.
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Inventory</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{readinessSummary.totalTemplates}</p>
          <p className="mt-1 text-xs text-text-muted">등록된 후보 서식</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Ready candidate</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{readinessSummary.readyCandidateCount}</p>
          <p className="mt-1 text-xs text-text-muted">준비 후보</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Source needed</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{readinessSummary.sourceNeededCount}</p>
          <p className="mt-1 text-xs text-text-muted">원본 필요</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Conversion test</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">
            {readinessSummary.conversionTestNeededCount}
          </p>
          <p className="mt-1 text-xs text-text-muted">변환 테스트 필요</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Manual only</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{readinessSummary.manualOnlyCount}</p>
          <p className="mt-1 text-xs text-text-muted">수동 작성 유지</p>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Official source verified</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{officialSourceStatusSummary.verified}</p>
          <p className="mt-1 text-xs text-text-muted">공식 출처 확인</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Source review</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{officialSourceStatusSummary.needs_review}</p>
          <p className="mt-1 text-xs text-text-muted">최신성 확인 필요</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Source pending</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{officialSourceStatusSummary.pending}</p>
          <p className="mt-1 text-xs text-text-muted">공식 출처 미확인</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold text-text-muted">Manual only</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">{officialSourceStatusSummary.manual_only}</p>
          <p className="mt-1 text-xs text-text-muted">수동 작성 유지</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ui-kicker">Official source priority</p>
            <h3 className="mt-2 ui-section-title">공식 출처 검토 우선순위</h3>
            <p className="mt-2 text-sm text-text-muted">
              readiness와 별도로, 고위험 서식의 공식 출처/최신성 확인 대상을 먼저 보여줍니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildDocumentTemplateFilterHref(filters, { risk: "high", sourceStatus: "needs_review" })}
              className={filterLinkClassName(false)}
            >
              고위험 최신성 확인
            </Link>
            <Link
              href={buildDocumentTemplateFilterHref(filters, { risk: "high", sourceStatus: "pending" })}
              className={filterLinkClassName(false)}
            >
              고위험 출처 미확인
            </Link>
            <Link
              href={buildDocumentTemplateFilterHref(filters, { sourceStatus: "manual_only" })}
              className={filterLinkClassName(false)}
            >
              수동 작성 유지
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Card muted className="p-4">
            <p className="text-xs font-semibold text-text-muted">긴급 검토</p>
            <p className="mt-2 text-2xl font-bold text-text-strong">{sourcePrioritySummary.urgentCount}</p>
            <p className="mt-1 text-xs text-text-muted">고위험 + 미확인/최신성 확인</p>
          </Card>
          <Card muted className="p-4">
            <p className="text-xs font-semibold text-text-muted">고위험 미확인</p>
            <p className="mt-2 text-2xl font-bold text-text-strong">
              {sourcePrioritySummary.highRiskNeedsReviewCount}
            </p>
            <p className="mt-1 text-xs text-text-muted">업무범위/공식서식 검토 필요</p>
          </Card>
          <Card muted className="p-4">
            <p className="text-xs font-semibold text-text-muted">최신성 확인 필요</p>
            <p className="mt-2 text-2xl font-bold text-text-strong">{sourcePrioritySummary.needsReviewCount}</p>
            <p className="mt-1 text-xs text-text-muted">출처 후보 있음, 확인일 없음</p>
          </Card>
          <Card muted className="p-4">
            <p className="text-xs font-semibold text-text-muted">수동 작성 유지</p>
            <p className="mt-2 text-2xl font-bold text-text-strong">{sourcePrioritySummary.manualOnlyCount}</p>
            <p className="mt-1 text-xs text-text-muted">자동화 제외 후보</p>
          </Card>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card muted className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-strong">우선 검토 대상</p>
                <p className="mt-1 text-xs text-text-muted">긴급/높음 우선순위 서식만 표시합니다.</p>
              </div>
            </div>
            {sourcePrioritySummary.topPriorityTemplates.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">우선 검토 대상 서식이 없습니다.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {sourcePrioritySummary.topPriorityTemplates.map((template) => (
                  <div key={template.id} className="rounded-xl border border-line bg-surface p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-strong">{template.titleKo}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {template.id} · {template.categoryLabelKo}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                            sourcePriorityClassName[template.priority]
                          }`}
                        >
                          {template.priority === "urgent" ? "긴급" : "높음"}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                            riskClassName[template.riskLevel]
                          }`}
                        >
                          {getDocumentTemplateRiskLabel(template.riskLevel)}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                            officialSourceStatusClassName[template.sourceStatus]
                          }`}
                        >
                          {template.sourceStatusLabelKo}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-text-muted">{template.reasonLabelKo}</p>
                    <div className="mt-3 rounded-lg border border-line bg-surface-muted p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-text-strong">출처 검증 체크</p>
                        <p className="text-[11px] text-text-muted">
                          {template.checklist.completeCount}/{template.checklist.totalCount}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {template.checklist.items.map((item) => (
                          <span
                            key={item.id}
                            title={`${item.labelKo}: ${item.valueKo}`}
                            className={`inline-flex max-w-full rounded-full border px-2 py-1 text-[11px] font-semibold ${
                              sourceChecklistStatusClassName[item.status]
                            }`}
                          >
                            {item.labelKo}:{" "}
                            {item.status === "complete"
                              ? "완료"
                              : item.status === "needs_review"
                                ? "검토 필요"
                                : "확인 필요"}{" "}
                            · {formatCompactChecklistValue(item.valueKo)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card muted className="p-4">
            <p className="text-sm font-semibold text-text-strong">Risk별 출처 상태</p>
            <div className="mt-4 space-y-3 text-xs text-text-muted">
              {(["high", "medium", "low"] as const).map((risk) => {
                const counts = sourcePrioritySummary.statusByRisk[risk];
                return (
                  <div key={risk} className="rounded-xl border border-line bg-surface p-3">
                    <p className="font-semibold text-text-strong">{getDocumentTemplateRiskLabel(risk)}</p>
                    <p className="mt-2">
                      확인 {counts.verified} · 최신성 {counts.needs_review} · 미확인 {counts.pending} · 수동{" "}
                      {counts.manual_only}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ui-kicker">Official source work queue</p>
            <h3 className="mt-2 ui-section-title">공식 출처 검토 워크큐</h3>
            <p className="mt-2 text-sm text-text-muted">
              검토자 미기록, 최신 확인일 미기록, 공식 출처 미확인, 고위험 서식 검토 필요 항목을 read-only로 정렬합니다.
            </p>
            <p className="mt-2 text-xs text-text-muted">
              이 큐는 검토 우선순위 안내이며, 문서 생성 단계 도달을 의미하지 않습니다.
            </p>
          </div>
          <Link
            href={buildDocumentTemplateFilterHref(filters, { risk: "high", sourceStatus: "needs_review" })}
            className="text-sm font-medium text-primary"
          >
            고위험 최신성 확인 보기
          </Link>
        </div>

        {sourceVerificationWorkQueue.length === 0 ? (
          <p className="mt-5 rounded-xl border border-line bg-surface-muted px-4 py-4 text-sm text-text-muted">
            현재 표시할 공식 출처 검토 항목이 없습니다.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {sourceVerificationWorkQueue.map((item) => (
              <Link
                key={item.templateId}
                href={item.href}
                className="block rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong hover:bg-surface-muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-strong">{item.titleKo}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {item.templateId} · {item.categoryLabelKo}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                        sourcePriorityClassName[item.priority]
                      }`}
                    >
                      {item.priority === "urgent" ? "긴급" : item.priority === "high" ? "높음" : "검토"}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                        riskClassName[item.riskLevel]
                      }`}
                    >
                      {getDocumentTemplateRiskLabel(item.riskLevel)}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                        officialSourceStatusClassName[item.sourceStatus]
                      }`}
                    >
                      {item.sourceStatusLabelKo}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold text-text-strong">{item.primaryReasonLabelKo}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.missingReasons.slice(0, 3).map((reason) => (
                    <span
                      key={`${item.templateId}-${reason.id}`}
                      className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800"
                    >
                      {reason.labelKo}
                    </span>
                  ))}
                  {item.missingReasons.length > 3 ? (
                    <span className="inline-flex rounded-full border border-line bg-surface-muted px-2 py-1 text-[11px] font-semibold text-text-muted">
                      +{item.missingReasons.length - 3}개
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="ui-kicker">Pipeline overview</p>
            <h3 className="mt-2 ui-section-title">HWP/HWPX 공공서식 파이프라인</h3>
            <p className="mt-2 text-sm text-text-muted">
              HWP 원본은 source asset으로 추적하고, 검증된 HWPX/DOCX/HTML만 runtime template 후보로 올립니다.
            </p>
          </div>
          <Link href="/admin/ledger" className="text-sm font-medium text-primary">
            운영 데이터는 아직 연결하지 않음
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["1", "원본 확보", "공식 HWP 원본과 출처를 확인합니다."],
            ["2", "변환 검증", "HWPX/DOCX/HTML 후보의 표, 줄바꿈, 입력란을 비교합니다."],
            ["3", "관리자 미리보기", "샘플 데이터로 누락 필드와 레이아웃을 확인합니다."],
            ["4", "후속 연결", "검증 후 CaseMatter read-only 연결을 별도 PR로 다룹니다."]
          ].map(([step, title, description]) => (
            <Card key={step} muted className="p-4">
              <p className="text-xs font-semibold text-text-muted">Phase {step}</p>
              <h4 className="mt-2 text-sm font-semibold text-text-strong">{title}</h4>
              <p className="mt-2 text-xs text-text-muted">{description}</p>
            </Card>
          ))}
        </div>
      </Card>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="ui-kicker">Safety guardrails</p>
          <h3 className="mt-2 ui-section-title">안전 기준</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li>관리자 전용 화면입니다.</li>
            <li>read-only inventory만 표시합니다.</li>
            <li>공식 서식 최신성 확인 필요.</li>
            <li>고위험 문서는 업무범위와 공식 서식 확인 후 별도 단계에서 다룹니다.</li>
            <li>고객 발송 없음, 기관 제출 없음, AI 단독 법률판단 없음.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <p className="ui-kicker">Next steps</p>
          <h3 className="mt-2 ui-section-title">다음 단계 후보</h3>
          <ol className="mt-4 space-y-2 text-sm text-text-muted">
            <li>1. 공식 HWP 원본 확보 상태를 별도 checklist로 관리.</li>
            <li>2. 샘플 데이터 기반 HWPX/DOCX/HTML 변환 실험.</li>
            <li>3. preview-only placeholder renderer 설계.</li>
            <li>4. 검증 후 CaseMatter read-only 연결 검토.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
