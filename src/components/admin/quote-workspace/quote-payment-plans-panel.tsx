"use client";

import { CollapsibleSection } from "@/components/admin/quote-workspace-ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StateInline } from "@/components/ui/state-panel";
import type { QuoteSummarySnapshot } from "@/lib/quote-engine/types";
import { formatRange, stageKindLabels } from "@/lib/services/quote-workspace-helpers";

type PaymentPlans = QuoteSummarySnapshot["paymentPlans"];

type QuotePaymentPlansPanelProps = {
  paymentPlans: PaymentPlans;
  paymentPercentageTotal: number;
  open: boolean;
  onToggle: () => void;
  updatePaymentPlanField: <T extends keyof PaymentPlans[number]>(id: string, field: T, value: PaymentPlans[number][T]) => void;
};

export function QuotePaymentPlansPanel({
  paymentPlans,
  paymentPercentageTotal,
  open,
  onToggle,
  updatePaymentPlanField,
}: QuotePaymentPlansPanelProps) {
  return (
    <CollapsibleSection
      title="결제 계획"
      description="착수금, 중도금, 성공보수 비율과 안내 문구를 조정합니다."
      open={open}
      onToggle={onToggle}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {paymentPlans.map((plan) => (
          <Card key={plan.id} muted className="p-4">
            <p className="text-sm font-semibold text-text-strong">{stageKindLabels[plan.stageKind]}</p>
            <div className="mt-3 space-y-2">
              <Input type="number" value={plan.percentage} onChange={(event) => updatePaymentPlanField(plan.id, "percentage", Number(event.target.value))} />
              <Input value={plan.dueText} onChange={(event) => updatePaymentPlanField(plan.id, "dueText", event.target.value)} />
            </div>
            <p className="mt-2 text-xs text-text-muted">예상 금액 {formatRange(plan.amountMin, plan.amountMax)}</p>
          </Card>
        ))}
      </div>
      {paymentPercentageTotal !== 100 ? (
        <StateInline tone="error">현재 결제 비율 합계는 {paymentPercentageTotal}%입니다. 100%로 맞춰 주세요.</StateInline>
      ) : null}
    </CollapsibleSection>
  );
}
