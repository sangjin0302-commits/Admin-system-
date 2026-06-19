import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  buildDocumentTemplateFilterHref,
  buildDocumentTemplateSourceVerificationWorkQueue,
  buildDocumentTemplateSourceVerificationWorkQueueReasonFilterOptions,
  getDocumentTemplateRiskLabel,
  normalizeDocumentTemplateInventoryFilters
} from "@/lib/document-templates";

import {
  filterLinkClassName,
  officialSourceStatusClassName,
  riskClassName,
  sourcePriorityClassName
} from "./styles";

type Filters = ReturnType<typeof normalizeDocumentTemplateInventoryFilters>;
type WorkQueue = ReturnType<typeof buildDocumentTemplateSourceVerificationWorkQueue>;
type ReasonFilterOptions = ReturnType<
  typeof buildDocumentTemplateSourceVerificationWorkQueueReasonFilterOptions
>;

export function WorkQueueSection({
  filters,
  sourceVerificationWorkQueue,
  missingReasonFilterOptions
}: {
  filters: Filters;
  sourceVerificationWorkQueue: WorkQueue;
  missingReasonFilterOptions: ReasonFilterOptions;
}) {
  return (
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
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-surface-muted p-4">
        <p className="text-sm font-semibold text-text-strong">누락 사유 quick filter</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {missingReasonFilterOptions.map((option) => (
            <Link
              key={option.missingReason ?? "all"}
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
  );
}
