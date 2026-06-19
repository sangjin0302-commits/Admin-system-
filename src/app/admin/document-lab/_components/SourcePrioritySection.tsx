import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  buildDocumentTemplateFilterHref,
  buildDocumentTemplateSourceVerificationPriority,
  getDocumentTemplateRiskLabel,
  normalizeDocumentTemplateInventoryFilters
} from "@/lib/document-templates";

import {
  filterLinkClassName,
  formatCompactChecklistValue,
  officialSourceStatusClassName,
  riskClassName,
  sourceChecklistStatusClassName,
  sourcePriorityClassName
} from "./styles";

type Filters = ReturnType<typeof normalizeDocumentTemplateInventoryFilters>;
type PrioritySummary = ReturnType<typeof buildDocumentTemplateSourceVerificationPriority>;

export function SourcePrioritySection({
  filters,
  sourcePrioritySummary
}: {
  filters: Filters;
  sourcePrioritySummary: PrioritySummary;
}) {
  return (
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
  );
}
