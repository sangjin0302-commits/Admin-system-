"use client";

import { InfoPanel } from "@/components/admin/quote-workspace-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateInline } from "@/components/ui/state-panel";
import type { QuoteWorkspace } from "@/lib/quote-engine/types";

type QuoteEmptyStateCardProps = {
  workspace: QuoteWorkspace;
  isPending: boolean;
  message: string;
  tone: "default" | "success" | "error";
  onCreateQuote: () => void;
};

export function QuoteEmptyStateCard({
  workspace,
  isPending,
  message,
  tone,
  onCreateQuote,
}: QuoteEmptyStateCardProps) {
  return (
    <Card className="p-6">
      <h3 className="ui-section-title">견적 초안 생성</h3>
      <p className="mt-2 text-sm text-text-muted">문의 내용을 기준으로 추천 서비스와 사건 분석을 반영해 견적 초안을 만듭니다.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoPanel label="추천 서비스" value={workspace.suggestedServiceLegacyIds.map((legacyId) => workspace.masters.serviceTypes.find((service) => service.legacyId === legacyId)?.name ?? legacyId).join(", ")} />
        <InfoPanel label="추천 긴급도 규칙" value={workspace.masters.urgencyRules.find((rule) => rule.code === workspace.suggestedUrgencyRuleCode)?.label ?? workspace.suggestedUrgencyRuleCode} />
      </div>
      <div className="mt-5">
        <Button onClick={onCreateQuote} disabled={isPending}>{isPending ? "생성 중..." : "견적 초안 만들기"}</Button>
      </div>
      {message ? <StateInline tone={tone}>{message}</StateInline> : null}
    </Card>
  );
}
