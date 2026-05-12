import Link from "next/link";

import { Card } from "@/components/ui/card";
import type {
  CaseMatterActionItem,
  CaseMatterActionSummary
} from "@/lib/services/case-matter-action-view-model";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { getCaseMatterStatusLabel } from "@/types/case-matter";

type UiLocale = "ko" | "en";

const summaryTiles: Array<{
  key: keyof CaseMatterActionSummary["counts"];
  label: string;
}> = [
  { key: "today", label: "오늘 처리할 사건" },
  { key: "dueSoon", label: "기한 임박" },
  { key: "backlog", label: "미제출/보완 필요" },
  { key: "stalled", label: "장기 대기/정체" }
];

function toneClassName(tone: CaseMatterActionItem["tone"]) {
  if (tone === "danger") return "border-danger/30 bg-danger/5";
  if (tone === "warning") return "border-warning/40 bg-warning/5";
  return "border-line bg-surface-muted";
}

function CaseMatterSummaryItem({ item, locale }: { item: CaseMatterActionItem; locale: UiLocale }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "block rounded-xl border px-3 py-3 transition hover:border-line-strong hover:bg-surface",
        toneClassName(item.tone)
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface px-2 py-1 text-xs font-semibold text-text-strong">
            {item.ddayLabel}
          </span>
          <span className="text-xs font-semibold text-text-muted">
            {item.caseNo ?? "사건번호 없음"}
          </span>
        </div>
        <p className="line-clamp-1 text-sm font-semibold text-text-strong">{item.title}</p>
        <div className="grid gap-1 text-xs text-text-muted sm:grid-cols-2">
          <span>{getCaseMatterStatusLabel(item.status, locale)}</span>
          <span>{item.reasons[0] ?? "운영 점검 필요"}</span>
          <span>기한 {formatDate(item.dueDate)}</span>
          <span>다음 액션 {formatDateTime(item.nextActionAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function CaseMatterActionSummaryCard({
  summary,
  locale
}: {
  summary: CaseMatterActionSummary;
  locale: UiLocale;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="ui-kicker">Case Operations</p>
          <h3 className="mt-2 ui-section-title">오늘 할 일</h3>
          <p className="mt-2 text-sm text-text-muted">
            사건 기한, 다음 액션, 자료 보완, 기관 대기 상태를 첫 화면에서 빠르게 확인합니다.
          </p>
        </div>
        <Link href="/admin/cases" className="text-sm font-medium text-primary">
          오늘 할 일 전체 보기
        </Link>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {summaryTiles.map((tile) => (
          <div key={tile.key} className="rounded-xl border border-line bg-surface-muted px-3 py-3">
            <p className="text-xs text-text-muted">{tile.label}</p>
            <p className="mt-1 text-xl font-semibold text-text-strong">{summary.counts[tile.key]}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {!summary.hasImmediateWork ? (
          <p className="rounded-xl border border-line bg-surface-muted px-3 py-3 text-sm text-text-muted">
            오늘 긴급하게 처리할 사건이 없습니다.
          </p>
        ) : null}
        {!summary.hasOperationalIssues ? (
          <p className="rounded-xl border border-line bg-surface-muted px-3 py-3 text-sm text-text-muted">
            기한 임박 또는 미제출 자료 이슈가 없습니다.
          </p>
        ) : null}
      </div>

      {summary.topItems.length > 0 ? (
        <div className="mt-5 space-y-3">
          {summary.topItems.map((item) => (
            <CaseMatterSummaryItem key={item.id} item={item} locale={locale} />
          ))}
        </div>
      ) : null}
    </Card>
  );
}
