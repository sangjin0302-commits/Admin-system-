"use client";

import {
  CollapsibleSection,
  FieldBlock,
} from "@/components/admin/quote-workspace-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/state-panel";
import { Textarea } from "@/components/ui/textarea";
import type { QuoteWorkspace } from "@/lib/quote-engine/types";
import { formatRange } from "@/lib/services/quote-workspace-helpers";

type ServiceTypes = QuoteWorkspace["masters"]["serviceTypes"];

type QuoteConditionsPanelProps = {
  workspace: QuoteWorkspace;
  filteredGroupedServices: ReadonlyArray<readonly [string, ServiceTypes]>;
  filteredOptions: QuoteWorkspace["masters"]["pricingOptions"];
  selectedServices: string[];
  selectedOptions: string[];
  serviceSearch: string;
  optionSearch: string;
  urgencyRuleCode: string;
  consultRuleCode: string;
  paymentRuleCode: string;
  rangeMode: boolean;
  draftNotes: string;
  isPending: boolean;
  open: boolean;
  onToggle: () => void;
  onServiceSearchChange: (value: string) => void;
  onOptionSearchChange: (value: string) => void;
  onToggleService: (legacyId: string) => void;
  onToggleOption: (legacyId: string) => void;
  onUrgencyRuleChange: (value: string) => void;
  onConsultRuleChange: (value: string) => void;
  onPaymentRuleChange: (value: string) => void;
  onRangeModeChange: (value: boolean) => void;
  onDraftNotesChange: (value: string) => void;
  onRecalculate: () => void;
  onSaveManualEdits: () => void;
};

export function QuoteConditionsPanel({
  workspace,
  filteredGroupedServices,
  filteredOptions,
  selectedServices,
  selectedOptions,
  serviceSearch,
  optionSearch,
  urgencyRuleCode,
  consultRuleCode,
  paymentRuleCode,
  rangeMode,
  draftNotes,
  isPending,
  open,
  onToggle,
  onServiceSearchChange,
  onOptionSearchChange,
  onToggleService,
  onToggleOption,
  onUrgencyRuleChange,
  onConsultRuleChange,
  onPaymentRuleChange,
  onRangeModeChange,
  onDraftNotesChange,
  onRecalculate,
  onSaveManualEdits,
}: QuoteConditionsPanelProps) {
  return (
    <CollapsibleSection
      title="견적 조건 조정"
      description="서비스, 옵션, 규칙, 메모를 조정하는 영역입니다. 필요할 때만 펼쳐서 수정하면 됩니다."
      open={open}
      onToggle={onToggle}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-text-strong">서비스 선택</p>
            <div className="mt-3">
              <Input
                value={serviceSearch}
                onChange={(event) => onServiceSearchChange(event.target.value)}
                placeholder="서비스명, 분야, 코드로 검색"
              />
            </div>
            <div className="mt-3 space-y-4">
              {filteredGroupedServices.length === 0 ? (
                <EmptyState
                  title="검색 결과가 없습니다."
                  description="다른 키워드로 다시 검색해 보세요."
                />
              ) : null}
              {filteredGroupedServices.map(([category, services]) => (
                <Card key={category} muted className="p-4">
                  <p className="text-sm font-semibold text-text-strong">{category}</p>
                  <div className="mt-3 space-y-2">
                    {services.map((service) => (
                      <label key={service.legacyId} className="flex items-start gap-3 rounded-md bg-surface px-3 py-2 text-sm text-text">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.legacyId)}
                          onChange={() => onToggleService(service.legacyId)}
                          className="mt-1 h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
                        />
                        <span>
                          <span className="font-medium text-text-strong">{service.name}</span>
                          <span className="mt-1 block text-xs text-text-muted">{formatRange(service.minPrice, service.maxPrice)}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-strong">옵션 선택</p>
            <div className="mt-3">
              <Input
                value={optionSearch}
                onChange={(event) => onOptionSearchChange(event.target.value)}
                placeholder="옵션명, 설명, 코드로 검색"
              />
            </div>
            <div className="mt-3 grid gap-2">
              {filteredOptions.length === 0 ? (
                <EmptyState
                  title="검색 결과가 없습니다."
                  description="원하는 옵션 키워드를 다시 입력해 보세요."
                />
              ) : null}
              {filteredOptions.map((option) => (
                <label key={option.legacyId} className="flex items-start gap-3 rounded-md border border-line bg-surface-muted px-3 py-3 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option.legacyId)}
                    onChange={() => onToggleOption(option.legacyId)}
                    className="mt-1 h-4 w-4 rounded border-line-strong text-primary focus:ring-primary/20"
                  />
                  <span>
                    <span className="font-medium text-text-strong">{option.name}</span>
                    <span className="mt-1 block text-xs text-text-muted">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBlock label="긴급도 규칙">
              <Select value={urgencyRuleCode} onChange={(event) => onUrgencyRuleChange(event.target.value)}>
                {workspace.masters.urgencyRules.map((rule) => (
                  <option key={rule.code} value={rule.code}>{rule.label}</option>
                ))}
              </Select>
            </FieldBlock>
            <FieldBlock label="상담료 규칙">
              <Select value={consultRuleCode} onChange={(event) => onConsultRuleChange(event.target.value)}>
                {workspace.masters.consultRules.map((rule) => (
                  <option key={rule.code} value={rule.code}>{rule.label}</option>
                ))}
              </Select>
            </FieldBlock>
            <FieldBlock label="결제 규칙">
              <Select value={paymentRuleCode} onChange={(event) => onPaymentRuleChange(event.target.value)}>
                {workspace.masters.paymentRules.map((rule) => (
                  <option key={rule.code} value={rule.code}>{rule.label}</option>
                ))}
              </Select>
            </FieldBlock>
            <FieldBlock label="범위 모드">
              <label className="flex h-11 items-center gap-3 rounded-md border border-line bg-surface px-3 text-sm text-text">
                <input type="checkbox" checked={rangeMode} onChange={(event) => onRangeModeChange(event.target.checked)} />
                금액 범위를 유지합니다.
              </label>
            </FieldBlock>
          </div>

          <FieldBlock label="견적 메모">
            <Textarea rows={10} value={draftNotes} onChange={(event) => onDraftNotesChange(event.target.value)} />
          </FieldBlock>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onRecalculate} disabled={isPending}>{isPending ? "계산 중..." : "견적 다시 계산"}</Button>
            <Button variant="secondary" onClick={onSaveManualEdits} disabled={isPending}>수정 내용 저장</Button>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
