"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LawbotReviewReadonlyUiModel } from "@/lib/services/lawbot-review-readonly-ui-model";
import {
  areLawbotApprovalChecksComplete,
  getLawbotReviewApprovalPanelState,
  type LawbotReviewApprovalChecks
} from "@/lib/services/lawbot-review-approval-ui-model";

import { toStatusBadgeTone } from "./shared";

function ApprovalChecklistItem({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-line/80 bg-white px-3 py-3 text-sm text-text-strong">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="mt-1 h-4 w-4 rounded border-line-strong"
      />
      <span>{label}</span>
    </label>
  );
}

export function InternalApprovalPanel({
  model,
  checks,
  operatorNote,
  error,
  processing,
  onCheckChange,
  onOperatorNoteChange,
  onProcess
}: {
  model: LawbotReviewReadonlyUiModel;
  checks: LawbotReviewApprovalChecks;
  operatorNote: string;
  error: string | null;
  processing: boolean;
  onCheckChange: (key: keyof LawbotReviewApprovalChecks, value: boolean) => void;
  onOperatorNoteChange: (value: string) => void;
  onProcess: () => void;
}) {
  const panelState = getLawbotReviewApprovalPanelState(model);
  const checksComplete = areLawbotApprovalChecksComplete(checks);
  const canProcess = panelState.canShowApprovalControls && checksComplete && !processing;

  return (
    <Card muted className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ui-kicker">관리자 내부 승인</p>
          <h2 className="mt-1 text-lg font-semibold text-text-strong">내부 검토 확인</h2>
          <p className="mt-2 text-sm text-text-muted">{panelState.statusMessage}</p>
        </div>
        <Badge className={toStatusBadgeTone(model.workflowStatus)}>{model.workflowStatus}</Badge>
      </div>

      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        외부 발송/제출은 별도 단계에서만 가능합니다. 이 패널은 내부 승인 상태만 변경합니다.
      </p>

      {panelState.state === "approved" ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          내부 승인 완료 상태입니다. 승인 버튼은 비활성화되어 있습니다.
        </p>
      ) : null}

      {panelState.state === "blocked" ? (
        <p className="mt-4 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text-muted">
          APPROVAL_PENDING 상태에서만 내부 승인 처리가 가능합니다.
        </p>
      ) : null}

      {panelState.canShowApprovalControls ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <ApprovalChecklistItem
              checked={checks.manualReviewChecked}
              label="수동 검토 항목을 확인했습니다."
              onChange={(value) => onCheckChange("manualReviewChecked", value)}
            />
            <ApprovalChecklistItem
              checked={checks.sourcesChecked}
              label="출처 확인 필요 항목을 확인했습니다."
              onChange={(value) => onCheckChange("sourcesChecked", value)}
            />
            <ApprovalChecklistItem
              checked={checks.riskFlagsChecked}
              label="위험 신호를 확인했습니다."
              onChange={(value) => onCheckChange("riskFlagsChecked", value)}
            />
            <ApprovalChecklistItem
              checked={checks.draftsReviewed}
              label="초안 목록을 확인했습니다."
              onChange={(value) => onCheckChange("draftsReviewed", value)}
            />
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-text-strong">관리자 검토 메모</span>
            <textarea
              value={operatorNote}
              onChange={(event) => onOperatorNoteChange(event.currentTarget.value)}
              placeholder="검토 근거나 특이사항을 간단히 남겨주세요."
              className="mt-2 min-h-[96px] w-full rounded-xl border border-line-strong bg-white px-3 py-2 text-sm text-text-strong outline-none transition focus:border-accent"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <Button onClick={onProcess} disabled={!canProcess}>
            {processing ? "처리 중..." : "내부 승인 처리"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
