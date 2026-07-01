"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LawbotResponse } from "@/lib/services/lawbot-case-analysis-types";
import { calculateQuoteGuidance } from "@/lib/services/quote-guidance-service";

type Props = {
  snapshot: LawbotResponse | null;
  category: string | null;
};

const complexityToneMap: Record<string, string> = {
  간단: "bg-green-50 text-green-700 border-green-200",
  보통: "bg-blue-50 text-blue-700 border-blue-200",
  복잡: "bg-yellow-50 text-yellow-800 border-yellow-200",
  "매우 복잡": "bg-red-50 text-red-700 border-red-200"
};

function formatKrw(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

export function QuoteGuidanceCard({ snapshot, category }: Props) {
  const guidance = calculateQuoteGuidance(snapshot, category);
  const complexityTone =
    complexityToneMap[guidance.complexityLabel] ?? complexityToneMap["보통"];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">견적 가이드</p>
          <p className="mt-1 text-xs text-text-muted">
            카테고리: {guidance.categoryUsed} · 배수 ×
            {guidance.complexityMultiplier.toFixed(2)}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
            complexityTone
          )}
        >
          {guidance.complexityLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-line bg-surface-muted p-3">
          <p className="text-xs text-text-muted">최소</p>
          <p className="mt-1 text-lg font-semibold text-text">
            {formatKrw(guidance.minKrw)}
          </p>
        </div>
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs text-blue-700">적정</p>
          <p className="mt-1 text-lg font-bold text-blue-900">
            {formatKrw(guidance.typicalKrw)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface-muted p-3">
          <p className="text-xs text-text-muted">최대</p>
          <p className="mt-1 text-lg font-semibold text-text">
            {formatKrw(guidance.maxKrw)}
          </p>
        </div>
      </div>

      {guidance.reasoning.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-text">산정 근거</p>
          <ul className="mt-2 space-y-1 text-sm text-text-muted">
            {guidance.reasoning.map((item, idx) => (
              <li key={`reason-${idx}`}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.alert("구현 예정");
            }
          }}
        >
          견적 초안 생성
        </Button>
      </div>
    </Card>
  );
}
