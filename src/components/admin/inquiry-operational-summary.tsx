"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type InquiryOperationalSummaryProps = {
  inquiryId: string;
  strengthLabel: string;
  strengthScore: number;
  qualificationScore: number;
  recommendedAction: string;
  quickStatuses: Array<{ code: string; label: string }>;
  missingFacts: string[];
  lawbotStatus: "available" | "disabled" | "error";
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
}: InquiryOperationalSummaryProps) {
  const [copied, setCopied] = useState(false);

  const summaryText = [
    "[운영 요약]",
    `- 문의 ID: ${inquiryId}`,
    `- 사건 강도: ${strengthLabel} (${strengthScore}점)`,
    `- 수임 적합도: ${qualificationScore} / 100`,
    `- 권장 다음 조치: ${recommendedAction}`,
    "",
    "[우선 확인 사항]",
    ...(missingFacts.length > 0 ? missingFacts.slice(0, 4).map((item) => `- ${item}`) : ["- 추가 확인 사항 없음"]),
  ].join("\n");

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
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

      <p className="mt-4 text-sm font-semibold text-text-strong">지금 바로 할 일</p>
      <p className="mt-2 text-sm text-text">{recommendedAction}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <MetricCard label="수임 적합도" value={`${qualificationScore} / 100`} />
        <MetricCard label="우선 확인 수" value={`${Math.max(missingFacts.length, 1)}건`} />
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
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-text">
          {(missingFacts.length > 0 ? missingFacts.slice(0, 4) : ["추가 확인 사항 없음"]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button size="sm" variant="secondary" onClick={copySummary}>
          {copied ? "요약 복사됨" : "운영 요약 복사"}
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