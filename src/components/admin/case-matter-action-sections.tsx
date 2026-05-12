import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { CaseMatterActionDashboard, CaseMatterActionItem } from "@/lib/services/case-matter-action-view-model";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { getCaseMatterStatusLabel } from "@/types/case-matter";

type UiLocale = "ko" | "en";

const actionGroups: Array<{
  key: keyof CaseMatterActionDashboard;
  title: string;
  description: string;
  empty: string;
}> = [
  {
    key: "today",
    title: "오늘 처리할 사건",
    description: "다음 액션일, 사건 기한, 진행 중 태스크가 오늘이거나 지났습니다.",
    empty: "오늘 처리할 사건이 없습니다."
  },
  {
    key: "dueSoon",
    title: "기한 임박",
    description: "사건, 필수자료, 보완 요청 기한이 7일 이내입니다.",
    empty: "기한 임박 사건이 없습니다."
  },
  {
    key: "backlog",
    title: "미제출/보완 필요",
    description: "미제출 자료 또는 보완 응답이 필요한 사건입니다.",
    empty: "미제출 또는 보완 필요 자료가 없습니다."
  },
  {
    key: "stalled",
    title: "장기 대기/정체",
    description: "기관 대기, 보완 요청, 보류 또는 장기 미업데이트 사건입니다.",
    empty: "장기 대기 또는 정체 사건이 없습니다."
  }
];

function toneClassName(tone: CaseMatterActionItem["tone"]) {
  if (tone === "danger") return "border-danger/30 bg-danger/5";
  if (tone === "warning") return "border-warning/40 bg-warning/5";
  return "border-line bg-surface-muted";
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-strong">
      {count}건
    </span>
  );
}

function CaseActionItem({ item, locale }: { item: CaseMatterActionItem; locale: UiLocale }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "block rounded-xl border p-3 transition hover:border-line-strong hover:bg-surface",
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
        <p className="line-clamp-2 text-sm font-semibold text-text-strong">{item.title}</p>
        <p className="line-clamp-2 text-xs text-text">{item.nextActionMessage}</p>
        <div className="grid gap-1 text-xs text-text-muted sm:grid-cols-2">
          <span>{getCaseMatterStatusLabel(item.status, locale)}</span>
          <span>우선순위 {item.priority} / 리스크 {item.riskLevel}</span>
          <span>기한 {formatDate(item.dueDate)}</span>
          <span>다음 액션 {formatDateTime(item.nextActionAt)}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {item.reasons.map((reason) => (
            <span key={reason} className="rounded-full bg-surface px-2 py-1 text-xs text-text-muted">
              {reason}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function CaseMatterActionSections({
  dashboard,
  locale
}: {
  dashboard: CaseMatterActionDashboard;
  locale: UiLocale;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="ui-kicker">Case Action Queue</p>
          <h3 className="mt-2 ui-section-title">오늘 할 일 / 기한관리</h3>
          <p className="mt-2 text-sm text-text-muted">
            사건 기한, 다음 액션, 태스크, 필수자료, 보완 요청을 읽기 전용으로 모아봅니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {actionGroups.map((group) => (
            <div key={group.key} className="rounded-lg border border-line bg-surface-muted px-3 py-2">
              <p className="text-text-muted">{group.title}</p>
              <p className="mt-1 text-base font-semibold text-text-strong">{dashboard[group.key].length}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {actionGroups.map((group) => {
          const items = dashboard[group.key];
          return (
            <section key={group.key} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-text-strong">{group.title}</h4>
                  <p className="mt-1 text-xs text-text-muted">{group.description}</p>
                </div>
                <CountBadge count={items.length} />
              </div>
              {items.length === 0 ? (
                <p className="mt-4 rounded-xl border border-line bg-surface-muted p-3 text-sm text-text-muted">
                  {group.empty}
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {items.slice(0, 5).map((item) => (
                    <CaseActionItem key={`${group.key}-${item.id}`} item={item} locale={locale} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Card>
  );
}
