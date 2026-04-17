"use client";

import { Card } from "@/components/ui/card";

export type InquiryCaseTimelineItem = {
  title: string;
  description: string;
  timestamp: string;
  tone?: "default" | "success" | "warning" | "primary";
  emphasis?: string;
};

export function InquiryCaseTimeline({
  items
}: {
  items: InquiryCaseTimelineItem[];
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="ui-kicker">Case Timeline</p>
          <h3 className="ui-section-title mt-2">고객 사건 타임라인</h3>
          <p className="mt-2 text-sm text-text-muted">
            접수, 분석, 추천 경로, 견적, 사건 진행 단계까지 고객 사건 중심으로 시간축에 맞춰 읽을 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {items.map((item, index) => (
          <div key={`${item.title}-${item.timestamp}-${index}`} className="relative pl-8">
            {index < items.length - 1 ? (
              <span className="absolute left-[11px] top-7 h-[calc(100%+16px)] w-px bg-border/70" />
            ) : null}
            <span
              className={[
                "absolute left-0 top-1.5 h-6 w-6 rounded-full border",
                item.tone === "success" ? "border-emerald-200 bg-emerald-50" : "",
                item.tone === "warning" ? "border-amber-200 bg-amber-50" : "",
                item.tone === "primary" ? "border-primary/30 bg-primary-soft" : "",
                !item.tone || item.tone === "default" ? "border-line-strong bg-white" : ""
              ].join(" ")}
            />
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-strong">{item.title}</p>
                <p className="text-xs text-text-muted">{item.timestamp}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-text-muted">{item.description}</p>
              {item.emphasis ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-strong">{item.emphasis}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
