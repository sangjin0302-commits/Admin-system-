import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AlertTone = "danger" | "warning" | "info" | "neutral";

type InquiryFlowAlert = {
  key: string;
  title: string;
  count: number;
  description: string;
  tone: AlertTone;
  href?: string;
};

function toneClassName(tone: AlertTone) {
  if (tone === "danger") return "border-danger/30 bg-danger/5";
  if (tone === "warning") return "border-warning/30 bg-warning/5";
  if (tone === "info") return "border-info/30 bg-info/5";
  return "border-line bg-surface";
}

export function InquiryFlowAlerts({ alerts }: { alerts: InquiryFlowAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="ui-kicker">Flow Alerts</p>
          <h3 className="mt-1 text-lg font-semibold text-text-strong">운영 병목 알림</h3>
        </div>
        <p className="text-sm text-text-muted">당장 관리가 필요한 흐름만 우선 보여줍니다.</p>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-4">
        {alerts.map((alert) => {
          const content = (
            <Card muted className={cn("p-4", toneClassName(alert.tone))}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">{alert.title}</p>
              <p className="mt-2 text-3xl font-semibold text-text-strong">{alert.count}</p>
              <p className="mt-2 text-sm text-text-muted">{alert.description}</p>
            </Card>
          );

          if (alert.href) {
            return (
              <Link key={alert.key} href={alert.href} className="block">
                {content}
              </Link>
            );
          }

          return <div key={alert.key}>{content}</div>;
        })}
      </div>
    </Card>
  );
}
