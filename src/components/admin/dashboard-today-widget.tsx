"use client";

import Link from "next/link";

type TodayItem = {
  label: string;
  count: number;
  href: string;
  tone: "danger" | "warning" | "info" | "success";
};

const TONE_STYLES = {
  danger: "border-l-danger bg-danger/5 text-danger",
  warning: "border-l-warning bg-warning/5 text-warning",
  info: "border-l-primary bg-primary/5 text-primary",
  success: "border-l-success bg-success/5 text-success",
} as const;

export function DashboardTodayWidget({ items }: { items: TodayItem[] }) {
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Today</p>
          <h3 className="mt-1 text-lg font-semibold text-text-strong">오늘 할 일</h3>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {total}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center justify-between rounded-lg border-l-4 px-3 py-2.5 text-sm transition hover:opacity-80 ${TONE_STYLES[item.tone]}`}
          >
            <span className="font-medium text-text-strong">{item.label}</span>
            <span className="text-lg font-bold">{item.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export type { TodayItem };
