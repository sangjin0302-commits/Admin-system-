import Link from "next/link";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";

export function DashboardMetric({
  label,
  value,
  description
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-text-strong">{value}</p>
      <p className="mt-2 text-xs text-text-muted">{description}</p>
    </Card>
  );
}

export function DashboardListCard({
  kicker,
  title,
  emptyTitle,
  emptyDescription,
  items
}: {
  kicker: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  items: Array<{
    id: string;
    href: string;
    title: string;
    meta: string;
    description: string;
  }>;
}) {
  return (
    <Card className="p-6">
      <p className="ui-kicker">{kicker}</p>
      <h3 className="mt-2 ui-section-title">{title}</h3>
      {items.length > 0 ? (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-2xl border border-line bg-surface px-4 py-4 transition hover:border-line-strong hover:bg-surface-muted"
            >
              <p className="truncate text-sm font-semibold text-text-strong">{item.title}</p>
              <p className="mt-2 text-xs text-text-muted">{item.meta}</p>
              <p className="mt-1 truncate text-sm text-text">{item.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} className="mt-5" />
      )}
    </Card>
  );
}

export function dashboardToneClassName(tone: "default" | "consult" | "quote" | "risk" | "won") {
  if (tone === "consult") return "rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success";
  if (tone === "quote") return "rounded-full bg-info/10 px-3 py-1 text-xs font-semibold text-info";
  if (tone === "risk") return "rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning";
  if (tone === "won") return "rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary";
  return "rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text";
}
