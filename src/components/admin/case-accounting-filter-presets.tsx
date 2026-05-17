import Link from "next/link";

import type {
  AccountingFilterPreset,
  AccountingFilterPresetViewModel
} from "@/lib/services/case-accounting-summary-view-model";

type CaseAccountingFilterPresetItem = AccountingFilterPresetViewModel & {
  count: number;
  href: string;
};

type CaseAccountingFilterPresetsProps = {
  activePreset: AccountingFilterPreset;
  items: CaseAccountingFilterPresetItem[];
};

export function CaseAccountingFilterPresets({ activePreset, items }: CaseAccountingFilterPresetsProps) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ui-kicker">Accounting filters</p>
          <h3 className="text-base font-semibold text-text-strong">수임/입금 quick filter</h3>
          <p className="mt-1 text-sm text-text-muted">
            내부 관리용 필터입니다. 회계/세무 확정 자료가 아닙니다.
          </p>
        </div>
        <p className="text-xs font-medium text-text-muted">CSV export 정책은 기존과 동일합니다.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = item.preset === activePreset;
          return (
            <Link
              key={item.preset}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "inline-flex h-9 items-center gap-2 rounded-full bg-ink px-3 text-sm font-semibold text-white"
                  : "inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted"
              }
            >
              <span>{item.label}</span>
              <span className={active ? "text-white/80" : "text-text-muted"}>{item.count}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
