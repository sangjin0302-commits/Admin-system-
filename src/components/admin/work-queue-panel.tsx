"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, StateInline } from "@/components/ui/state-panel";
import type { WorkQueueItem, WorkQueueSnapshot } from "@/lib/work-queue/types";
import {
  workQueueSeverityLabels,
  workQueueTypeLabelOverrides,
  workQueueTypeLabels
} from "@/lib/work-queue/types";

const severityStyles: Record<WorkQueueItem["severity"], string> = {
  LOW: "border-slate-200 bg-slate-100 text-slate-700",
  MEDIUM: "border-sky-200 bg-sky-50 text-sky-700",
  HIGH: "border-amber-200 bg-amber-50 text-amber-700",
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700"
};

type WorkQueuePanelProps = {
  snapshot: WorkQueueSnapshot;
};

export function WorkQueuePanel({ snapshot }: WorkQueuePanelProps) {
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"default" | "success" | "error">("default");

  async function copyDraft(item: WorkQueueItem) {
    if (!item.messageDraft) return;

    try {
      await navigator.clipboard.writeText(item.messageDraft);
      setFeedback(`${item.title} 초안을 복사했습니다.`);
      setFeedbackTone("success");
    } catch {
      setFeedback("클립보드 복사에 실패했습니다.");
      setFeedbackTone("error");
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="ui-kicker">Operations Queue</p>
          <h3 className="mt-2 ui-section-title">알림/리마인더 작업 큐</h3>
          <p className="mt-2 text-sm text-text-muted">
            기한, 보완, 누락 서류, 견적 후속 상태를 기반으로 우선순위 작업을 자동 정리합니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          <QueueStat label="오늘" value={snapshot.counts.today} />
          <QueueStat label="임박" value={snapshot.counts.soon} />
          <QueueStat label="지연" value={snapshot.counts.overdue} />
          <QueueStat label="후속" value={snapshot.counts.followUp} />
          <QueueStat label="전체" value={snapshot.counts.total} />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <QueueSection
          title="오늘 처리할 일"
          description="오늘 기준 마감 또는 즉시 확인이 필요한 작업"
          items={snapshot.sections.today}
          onCopy={copyDraft}
        />
        <QueueSection
          title="임박한 일"
          description="3일 이내로 마감이 다가오는 작업"
          items={snapshot.sections.soon}
          onCopy={copyDraft}
        />
        <QueueSection
          title="지연된 일"
          description="기한이 지난 작업"
          items={snapshot.sections.overdue}
          onCopy={copyDraft}
        />
        <QueueSection
          title="후속조치 필요"
          description="기한은 없지만 누락/후속 확인이 필요한 작업"
          items={snapshot.sections.followUp}
          onCopy={copyDraft}
        />
      </div>

      {feedback ? (
        <StateInline tone={feedbackTone}>
          {feedback}
        </StateInline>
      ) : null}
    </Card>
  );
}

function QueueStat({ label, value }: { label: string; value: number }) {
  return (
    <Card muted className="px-3 py-2 text-center">
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-text-strong">{value}</p>
    </Card>
  );
}

function QueueSection({
  title,
  description,
  items,
  onCopy
}: {
  title: string;
  description: string;
  items: WorkQueueItem[];
  onCopy: (item: WorkQueueItem) => Promise<void>;
}) {
  return (
    <Card muted className="p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-text-strong">{title}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="해당 작업이 없습니다."
          description="현재 기준으로 추가 조치가 필요한 항목이 없습니다."
          className="mt-3"
        />
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={severityStyles[item.severity]}>
                  {workQueueSeverityLabels[item.severity]}
                </Badge>
                <Badge>
                  {workQueueTypeLabelOverrides[item.type] ??
                    workQueueTypeLabels[item.type as keyof typeof workQueueTypeLabels] ??
                    item.type}
                </Badge>
                {item.dueDate ? (
                  <span className="text-xs text-text-muted">
                    기한: {new Date(item.dueDate).toLocaleDateString("ko-KR")}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm font-semibold text-text-strong">{item.title}</p>
              <p className="mt-1 text-xs text-text-muted">{item.recommendedAction}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={item.href}
                  className="inline-flex items-center rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-text-strong hover:bg-surface-muted"
                >
                  관련 화면 열기
                </Link>
                {item.messageDraft ? (
                  <Button size="sm" variant="secondary" onClick={() => onCopy(item)}>
                    안내문 초안 복사
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
