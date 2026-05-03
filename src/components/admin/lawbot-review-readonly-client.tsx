"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import {
  buildLawbotReviewReadonlyUiModel,
  type LawbotReviewReadonlyUiModel
} from "@/lib/services/lawbot-review-readonly-ui-model";
import {
  areLawbotApprovalChecksComplete,
  buildLawbotApprovalRequestBody,
  getLawbotReviewApprovalPanelState,
  type LawbotReviewApprovalChecks
} from "@/lib/services/lawbot-review-approval-ui-model";
import {
  buildLawbotMessageSendReadinessUiModel,
  type LawbotMessageSendReadinessUiModel
} from "@/lib/services/lawbot-message-send-readiness-ui-model";

type LoadingState = "idle" | "loading" | "loaded" | "error";

function toStatusBadgeTone(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === "SUCCESS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("APPROVAL_PENDING")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalized.includes("FAILED") || normalized.includes("ERROR")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-line-strong bg-surface text-text-strong";
}

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <Badge
      className={
        value ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line-strong bg-surface text-text-strong"
      }
    >
      {value ? "예" : "아니오"}
    </Badge>
  );
}

function SafeBooleanLabel({ value }: { value: boolean }) {
  return <span className={value ? "text-emerald-700" : "text-rose-700"}>{value ? "예" : "아니오"}</span>;
}

function StatusCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">Lawbot 리뷰 요약</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">워크플로 상태</p>
          <div className="mt-1">
            <Badge className={toStatusBadgeTone(model.workflowStatus)}>{model.workflowStatus}</Badge>
          </div>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">실행 상태</p>
          <div className="mt-1">
            <Badge className={toStatusBadgeTone(model.executionStatus)}>{model.executionStatus}</Badge>
          </div>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">사건 번호</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.caseNumber ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">검토 필요</p>
          <div className="mt-1">
            <BooleanBadge value={model.reviewRequired} />
          </div>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-[11px] font-semibold tracking-[0.02em] text-text-muted">최근 업데이트</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{formatDateTime(model.updatedAt)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-text-muted">{model.executionSummary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className="border-line-strong bg-surface text-text-strong">문의 ID: {model.inquiryId}</Badge>
        <Badge className="border-line-strong bg-surface text-text-strong">사건 ID: {model.caseId ?? "-"}</Badge>
      </div>
    </Card>
  );
}

function ApprovalGateCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">승인 게이트</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">관리자 승인 필요</p>
          <div className="mt-1">
            <BooleanBadge value={model.approvalGate.approvalRequired} />
          </div>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">외부 실행 허용</p>
          <div className="mt-1">
            <BooleanBadge value={model.approvalGate.externalActionAllowed} />
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {model.readonlyNotice}
      </p>
      <p className="mt-3 text-xs font-semibold tracking-[0.02em] text-text-muted">승인 제한 사유</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {model.approvalGate.reasonCodes.length > 0 ? (
          model.approvalGate.reasonCodes.map((reason) => (
            <Badge key={reason} className="border-line-strong bg-surface text-text-strong">
              {reason}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-text-muted">승인 제한 사유 없음</span>
        )}
      </div>
    </Card>
  );
}

function ReviewSignalsCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">리뷰 신호 요약</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">수동 검토 항목</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewSignals.mustVerifyCount}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">출처 확인 항목</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewSignals.mustVerifySourcesCount}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">위험 신호</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewSignals.riskFlagsCount}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">출처 확인 필요 수</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">
            {model.reviewSignals.sourceVerificationChecklist.totalRequired}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ReviewQueueCard({ model }: { model: LawbotReviewReadonlyUiModel }) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">리뷰 큐 요약</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">전체 초안 수</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewQueue.totalDrafts}</p>
        </div>
        <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
          <p className="text-xs text-text-muted">승인 대기 초안 수</p>
          <p className="mt-1 text-sm font-semibold text-text-strong">{model.reviewQueue.approvalPendingDrafts}</p>
        </div>
      </div>
    </Card>
  );
}

function DraftList({
  title,
  items
}: {
  title: string;
  items: LawbotReviewReadonlyUiModel["reviewQueue"]["documentDrafts"];
}) {
  return (
    <Card muted className="p-5">
      <p className="ui-kicker">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">표시할 초안이 없습니다.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-text-muted">
                <th className="py-2 font-medium">초안 ID</th>
                <th className="py-2 font-medium">상태</th>
                <th className="py-2 font-medium">검토 필요</th>
                <th className="py-2 font-medium">생성일</th>
                <th className="py-2 font-medium">수정일</th>
              </tr>
            </thead>
            <tbody>
              {items.map((draft) => (
                <tr key={draft.id} className="border-b border-line/70 text-text-strong last:border-b-0">
                  <td className="py-2">{draft.id}</td>
                  <td className="py-2">
                    <Badge className={toStatusBadgeTone(draft.status)}>{draft.status}</Badge>
                  </td>
                  <td className="py-2">{draft.reviewRequired ? "예" : "아니오"}</td>
                  <td className="py-2">{formatDateTime(draft.createdAt)}</td>
                  <td className="py-2">{formatDateTime(draft.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function MessageSendReadinessPanel({
  model,
  state,
  error,
  onRefresh
}: {
  model: LawbotMessageSendReadinessUiModel | null;
  state: LoadingState;
  error: string | null;
  onRefresh: () => void;
}) {
  const hasBlockingReason = model
    ? !model.sendReadiness.ready || model.sendReadiness.reasonCodes.length > 0
    : false;

  return (
    <Card muted className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="ui-kicker">메시지 발송 준비 상태</p>
          <h2 className="mt-1 text-lg font-semibold text-text-strong">Dry-run 점검</h2>
          <p className="mt-2 text-sm text-text-muted">
            이 패널은 발송 준비 상태만 점검합니다. 실제 발송은 실행하지 않습니다.
          </p>
          <p className="mt-1 text-sm text-text-muted">외부 발송은 별도 단계에서만 가능합니다.</p>
        </div>
        <Button variant="secondary" onClick={onRefresh} disabled={state === "loading"}>
          {state === "loading" ? "불러오는 중" : "새로고침"}
        </Button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          메시지 발송 준비 상태를 불러오지 못했습니다.
        </p>
      ) : null}

      {!model && !error ? (
        <p className="mt-4 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text-muted">
          {state === "loading" || state === "idle"
            ? "메시지 발송 준비 상태를 불러오는 중입니다."
            : "표시할 메시지 발송 준비 상태가 없습니다."}
        </p>
      ) : null}

      {model ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
              <p className="text-xs text-text-muted">상태</p>
              <div className="mt-1">
                <Badge className={toStatusBadgeTone(model.sendReadiness.status)}>
                  {model.sendReadiness.status}
                </Badge>
              </div>
            </div>
            <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
              <p className="text-xs text-text-muted">준비 여부</p>
              <p className="mt-1 text-sm font-semibold">
                <SafeBooleanLabel value={model.sendReadiness.ready} />
              </p>
            </div>
            <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
              <p className="text-xs text-text-muted">Dry-run 점검</p>
              <p className="mt-1 text-sm font-semibold">
                <SafeBooleanLabel value={model.sendReadiness.dryRunOnly} />
              </p>
            </div>
            <div className="rounded-xl border border-line/80 bg-white px-3 py-3">
              <p className="text-xs text-text-muted">외부 발송 허용</p>
              <p className="mt-1 text-sm font-semibold">
                <SafeBooleanLabel value={model.sendReadiness.externalActionAllowed} />
              </p>
            </div>
          </div>

          {hasBlockingReason ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
              <p className="font-semibold">준비 제한 사유</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {model.sendReadiness.reasonCodes.map((reason) => (
                  <Badge key={reason} className="border-amber-200 bg-white text-amber-800">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-semibold text-text-strong">메시지 초안</p>
            {model.messageDrafts.length === 0 ? (
              <p className="mt-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-text-muted">
                표시할 메시지 초안이 없습니다.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-text-muted">
                      <th className="py-2 font-medium">초안 ID</th>
                      <th className="py-2 font-medium">상태</th>
                      <th className="py-2 font-medium">검토 필요</th>
                      <th className="py-2 font-medium">생성일</th>
                      <th className="py-2 font-medium">수정일</th>
                      <th className="py-2 font-medium">준비 상태</th>
                      <th className="py-2 font-medium">준비 제한 사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.messageDrafts.map((draft) => (
                      <tr key={draft.id} className="border-b border-line/70 text-text-strong last:border-b-0">
                        <td className="py-2">{draft.id}</td>
                        <td className="py-2">
                          <Badge className={toStatusBadgeTone(draft.status)}>{draft.status}</Badge>
                        </td>
                        <td className="py-2">
                          <SafeBooleanLabel value={draft.reviewRequired} />
                        </td>
                        <td className="py-2">{formatDateTime(draft.createdAt)}</td>
                        <td className="py-2">{formatDateTime(draft.updatedAt)}</td>
                        <td className="py-2">
                          <Badge className={toStatusBadgeTone(draft.readinessStatus)}>
                            {draft.readinessStatus}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {draft.reasonCodes.map((reason) => (
                              <Badge key={reason} className="border-line-strong bg-surface text-text-strong">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

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

function InternalApprovalPanel({
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

export function LawbotReviewReadonlyClient({ inquiryId }: { inquiryId: string }) {
  const [state, setState] = useState<LoadingState>("idle");
  const [model, setModel] = useState<LawbotReviewReadonlyUiModel | null>(null);
  const [sendReadinessState, setSendReadinessState] = useState<LoadingState>("idle");
  const [sendReadinessModel, setSendReadinessModel] =
    useState<LawbotMessageSendReadinessUiModel | null>(null);
  const [sendReadinessError, setSendReadinessError] = useState<string | null>(null);
  const [approvalChecks, setApprovalChecks] = useState<LawbotReviewApprovalChecks>({
    manualReviewChecked: false,
    sourcesChecked: false,
    riskFlagsChecked: false,
    draftsReviewed: false
  });
  const [operatorNote, setOperatorNote] = useState("");
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalProcessing, setApprovalProcessing] = useState(false);

  async function load() {
    setState("loading");
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(inquiryId)}/lawbot-review`, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("failed-to-load");
      }

      const payload = (await response.json()) as { result?: unknown };
      const nextModel = buildLawbotReviewReadonlyUiModel(payload.result ?? null);
      if (!nextModel) {
        throw new Error("invalid-response");
      }

      setModel(nextModel);
      setState("loaded");
    } catch {
      setState("error");
    }
  }

  async function loadMessageSendReadiness() {
    setSendReadinessState("loading");
    setSendReadinessError(null);
    try {
      const response = await fetch(
        `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/lawbot-review/message-send-readiness`,
        {
          method: "GET",
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("failed-to-load-send-readiness");
      }

      const payload = (await response.json()) as { result?: unknown };
      const nextModel = buildLawbotMessageSendReadinessUiModel(payload.result ?? null);
      if (!nextModel) {
        throw new Error("invalid-send-readiness-response");
      }

      setSendReadinessModel(nextModel);
      setSendReadinessState("loaded");
    } catch {
      setSendReadinessError("메시지 발송 준비 상태를 불러오지 못했습니다.");
      setSendReadinessState("error");
    }
  }

  async function processInternalApproval() {
    if (!model || !areLawbotApprovalChecksComplete(approvalChecks)) {
      return;
    }

    const confirmed = window.confirm(
      "내부 승인 처리하시겠습니까? 이 작업은 발송/제출을 실행하지 않습니다."
    );
    if (!confirmed) {
      return;
    }

    setApprovalProcessing(true);
    setApprovalError(null);
    try {
      const response = await fetch(
        `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/lawbot-review/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(buildLawbotApprovalRequestBody(approvalChecks, operatorNote))
        }
      );

      if (!response.ok) {
        throw new Error("approval-failed");
      }

      const payload = (await response.json()) as { result?: unknown };
      const nextModel = buildLawbotReviewReadonlyUiModel(payload.result ?? null);
      if (!nextModel) {
        throw new Error("invalid-approval-response");
      }

      setModel(nextModel);
      setApprovalChecks({
        manualReviewChecked: false,
        sourcesChecked: false,
        riskFlagsChecked: false,
        draftsReviewed: false
      });
      setOperatorNote("");
      setState("loaded");
    } catch {
      setApprovalError("내부 승인 처리에 실패했습니다. 상태를 확인한 뒤 다시 시도하세요.");
    } finally {
      setApprovalProcessing(false);
    }
  }

  useEffect(() => {
    void load();
    void loadMessageSendReadiness();
  }, [inquiryId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="ui-kicker">Lawbot 리뷰 (읽기 전용)</p>
          <h1 className="mt-1 text-2xl font-semibold text-text-strong">Lawbot 리뷰 결과</h1>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={state === "loading"}>
          {state === "loading" ? "불러오는 중..." : "새로고침"}
        </Button>
      </div>

      {state === "error" && !model ? (
        <Card muted className="p-5">
          <p className="text-sm text-text-muted">리뷰 정보를 불러오지 못했습니다.</p>
        </Card>
      ) : null}

      {model ? (
        <>
          <StatusCard model={model} />
          <ApprovalGateCard model={model} />
          <MessageSendReadinessPanel
            model={sendReadinessModel}
            state={sendReadinessState}
            error={sendReadinessError}
            onRefresh={() => void loadMessageSendReadiness()}
          />
          <InternalApprovalPanel
            model={model}
            checks={approvalChecks}
            operatorNote={operatorNote}
            error={approvalError}
            processing={approvalProcessing}
            onCheckChange={(key, value) =>
              setApprovalChecks((current) => ({
                ...current,
                [key]: value
              }))
            }
            onOperatorNoteChange={setOperatorNote}
            onProcess={() => void processInternalApproval()}
          />
          <ReviewSignalsCard model={model} />
          <ReviewQueueCard model={model} />
          <DraftList title="문안 초안" items={model.reviewQueue.documentDrafts} />
          <DraftList title="연락문 초안" items={model.reviewQueue.messageDrafts} />
        </>
      ) : state === "loading" || state === "idle" ? (
        <Card muted className="p-5">
          <p className="text-sm text-text-muted">리뷰 정보를 불러오는 중입니다.</p>
        </Card>
      ) : (
        <Card muted className="p-5">
          <p className="text-sm text-text-muted">표시할 데이터가 없습니다.</p>
        </Card>
      )}
    </div>
  );
}
