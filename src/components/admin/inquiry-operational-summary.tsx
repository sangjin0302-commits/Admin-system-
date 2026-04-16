"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { InquiryStatus } from "@/types/inquiry";

type AutomationAction = {
  label: string;
  description: string;
  status: InquiryStatus;
  memo: string;
};

type InquiryOperationalSummaryProps = {
  inquiryId: string;
  strengthLabel: string;
  strengthScore: number;
  qualificationScore: number;
  recommendedAction: string;
  quickStatuses: Array<{ code: string; label: string }>;
  missingFacts: string[];
  lawbotStatus: "available" | "disabled" | "error";
  automationActions: AutomationAction[];
};

export function InquiryOperationalSummary({
  inquiryId,
  strengthLabel,
  strengthScore,
  qualificationScore,
  recommendedAction,
  quickStatuses,
  missingFacts,
  lawbotStatus,
  automationActions,
}: InquiryOperationalSummaryProps) {
  const router = useRouter();
  const [copiedState, setCopiedState] = useState<"summary" | "checklist" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const priorityFacts =
    missingFacts.length > 0 ? missingFacts.slice(0, 4) : ["추가 확인이 필요한 항목은 아직 없습니다."];

  const summaryText = [
    "[운영 요약]",
    `- 문의 ID: ${inquiryId}`,
    `- 사건 강도: ${strengthLabel} (${strengthScore}점)`,
    `- 수임 적합도: ${qualificationScore} / 100`,
    `- 권장 다음 조치: ${recommendedAction}`,
    "",
    "[우선 확인 사항]",
    ...priorityFacts.map((item) => `- ${item}`),
  ].join("\n");

  const checklistText = [
    "[추가 확인 체크리스트]",
    ...priorityFacts.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n");

  async function copyText(kind: "summary" | "checklist", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(kind);
      setTimeout(() => setCopiedState(null), 1500);
    } catch {
      setCopiedState(null);
    }
  }

  async function applyAutomation(action: AutomationAction) {
    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: action.status,
          internalMemo: action.memo
        })
      });

      if (!response.ok) {
        setFeedback("자동 액션 반영 중 오류가 발생했습니다.");
        return;
      }

      setFeedback(`${action.label} 흐름으로 반영했습니다.`);
      router.refresh();
    });
  }

  return (
    <Card className="p-5 xl:sticky xl:top-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>운영 요약</Badge>
        <Badge className="border-primary/20 bg-primary-soft text-primary">
          {strengthLabel} · {strengthScore}점
        </Badge>
        <Badge className="border-line-strong bg-surface text-text-strong">
          Lawbot {lawbotStatus === "available" ? "연결됨" : lawbotStatus === "error" ? "오류" : "대기"}
        </Badge>
      </div>

      <p className="mt-4 text-sm font-semibold text-text-strong">지금 바로 볼 핵심</p>
      <p className="mt-2 text-sm leading-6 text-text">{recommendedAction}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <MetricCard label="수임 적합도" value={`${qualificationScore} / 100`} />
        <MetricCard label="우선 확인 항목" value={`${priorityFacts.length}건`} />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">빠른 상태 제안</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickStatuses.map((status) => (
            <span
              key={status.code}
              className="inline-flex items-center rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-text-strong"
            >
              {status.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">우선 확인 사항</p>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-text">
          {priorityFacts.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">운영 자동 액션</p>
        <div className="mt-3 space-y-3">
          {automationActions.map((action) => (
            <Card key={`${action.label}-${action.status}`} muted className="p-4">
              <p className="text-sm font-semibold text-text-strong">{action.label}</p>
              <p className="mt-1 text-sm text-text-muted">{action.description}</p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                disabled={isPending}
                onClick={() => void applyAutomation(action)}
              >
                {action.label} 반영
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {feedback ? <p className="mt-4 text-sm text-text-muted">{feedback}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button size="sm" variant="secondary" onClick={() => void copyText("summary", summaryText)}>
          {copiedState === "summary" ? "운영 요약 복사됨" : "운영 요약 복사"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void copyText("checklist", checklistText)}>
          {copiedState === "checklist" ? "체크리스트 복사됨" : "체크리스트 복사"}
        </Button>
        <a
          href="#quote-workspace"
          className="inline-flex h-9 items-center justify-center rounded-md border border-line-strong px-3 text-sm font-medium text-text-strong transition hover:bg-surface"
        >
          견적 작업으로 이동
        </a>
      </div>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card muted className="p-4">
      <p className="ui-kicker">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text-strong">{value}</p>
    </Card>
  );
}
