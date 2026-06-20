"use client";

import { CollapsibleSection } from "@/components/admin/quote-workspace-ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { QuoteSummarySnapshot } from "@/lib/quote-engine/types";

type LineItems = QuoteSummarySnapshot["lineItems"];
type Adjustments = QuoteSummarySnapshot["adjustments"];

type QuoteItemsPanelProps = {
  lineItems: LineItems;
  adjustments: Adjustments;
  open: boolean;
  onToggle: () => void;
  updateLineField: <T extends keyof LineItems[number]>(id: string, field: T, value: LineItems[number][T]) => void;
  updateAdjustmentField: <T extends keyof Adjustments[number]>(id: string, field: T, value: Adjustments[number][T]) => void;
};

export function QuoteItemsPanel({
  lineItems,
  adjustments,
  open,
  onToggle,
  updateLineField,
  updateAdjustmentField,
}: QuoteItemsPanelProps) {
  return (
    <CollapsibleSection
      title="항목 조정"
      description="서비스 라인과 가감 항목 금액을 직접 손볼 수 있습니다."
      open={open}
      onToggle={onToggle}
    >
      <div className="space-y-5">
        <div className="space-y-3">
          {lineItems.map((line) => (
            <Card key={line.id} muted className="p-4">
              <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
                <div className="space-y-2">
                  <Input value={line.label} onChange={(event) => updateLineField(line.id, "label", event.target.value)} />
                  <Input value={line.description ?? ""} onChange={(event) => updateLineField(line.id, "description", event.target.value || null)} placeholder="설명" />
                </div>
                <Input type="number" value={line.amountMin} onChange={(event) => updateLineField(line.id, "amountMin", Number(event.target.value))} />
                <Input type="number" value={line.amountMax} onChange={(event) => updateLineField(line.id, "amountMax", Number(event.target.value))} />
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          {adjustments.map((adjustment) => (
            <Card key={adjustment.id} muted className="p-4">
              <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
                <div className="space-y-2">
                  <Input value={adjustment.label} onChange={(event) => updateAdjustmentField(adjustment.id, "label", event.target.value)} />
                  <Input value={adjustment.description ?? ""} onChange={(event) => updateAdjustmentField(adjustment.id, "description", event.target.value || null)} placeholder="설명" />
                </div>
                <Input type="number" value={adjustment.computedMin} onChange={(event) => updateAdjustmentField(adjustment.id, "computedMin", Number(event.target.value))} />
                <Input type="number" value={adjustment.computedMax} onChange={(event) => updateAdjustmentField(adjustment.id, "computedMax", Number(event.target.value))} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}
