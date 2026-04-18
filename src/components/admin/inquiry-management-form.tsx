"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup } from "@/components/ui/field";
import { StateInline } from "@/components/ui/state-panel";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseClientApiError } from "@/lib/http/client-api";
import { attachInquiryChecklistStateBlock } from "@/lib/services/inquiry-checklist-state";
import {
  inquiryStatusLabels,
  inquiryStatusValues,
  type InquiryStatus
} from "@/types/inquiry";

type StatusGuardPreview = {
  status: InquiryStatus;
  label: string;
  allowed: boolean;
  blockers: string[];
};

const highImpactStatuses = new Set<InquiryStatus>(["WON", "CLOSED", "ON_HOLD"]);

const statusNotePresets: Partial<Record<InquiryStatus, string[]>> = {
  ON_HOLD: [
    "추가 사실관계 확인이 필요해 보류로 전환합니다.",
    "핵심 자료 미확보로 보류 후 자료 요청을 우선 진행합니다."
  ],
  WON: [
    "견적/상담 확인 완료로 수임 전환합니다.",
    "핵심 리스크와 서류 범위를 확인하고 수임으로 전환합니다."
  ],
  CLOSED: [
    "고객 요청/상담 결과에 따라 종결 처리합니다.",
    "후속 대응 완료 및 내부 검토 종료로 종결 처리합니다."
  ]
};

export function InquiryManagementForm({
  inquiryId,
  status: initialStatus,
  updatedAt,
  internalMemo: initialInternalMemo,
  internalMemoTail = null,
  quickStatuses = [],
  statusGuardPreview = []
}: {
  inquiryId: string;
  status: InquiryStatus;
  updatedAt: string;
  internalMemo: string | null;
  internalMemoTail?: string | null;
  quickStatuses?: InquiryStatus[];
  statusGuardPreview?: StatusGuardPreview[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [internalMemo, setInternalMemo] = useState(initialInternalMemo ?? "");
  const [statusChangeNote, setStatusChangeNote] = useState("");
  const [statusConfirmChecked, setStatusConfirmChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"default" | "error" | "success">("default");
  const [isPending, startTransition] = useTransition();

  const statusChanged = status !== initialStatus;
  const requiresHighImpactConfirm = statusChanged && highImpactStatuses.has(status);
  const requiresStatusChangeNote = statusChanged && (requiresHighImpactConfirm || status === "WON");
  const statusChangeNoteTrimmed = statusChangeNote.trim();

  const isSubmitDisabled = useMemo(() => {
    if (isPending) return true;
    if (requiresHighImpactConfirm && !statusConfirmChecked) return true;
    if (requiresStatusChangeNote && statusChangeNoteTrimmed.length < 6) return true;
    return false;
  }, [
    isPending,
    requiresHighImpactConfirm,
    requiresStatusChangeNote,
    statusConfirmChecked,
    statusChangeNoteTrimmed
  ]);

  useEffect(() => {
    setStatusConfirmChecked(false);
    setStatusChangeNote("");
  }, [status, initialStatus]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (isSubmitDisabled) {
      setMessageTone("error");
      setMessage("필수 확인 항목을 먼저 완료해 주세요.");
      return;
    }

    startTransition(async () => {
      const mergedInternalMemo = attachInquiryChecklistStateBlock(internalMemo, internalMemoTail);
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          internalMemo: mergedInternalMemo,
          statusChangeNote: statusChanged ? statusChangeNoteTrimmed : undefined,
          expectedUpdatedAt: updatedAt
        })
      });

      if (!response.ok) {
        setMessageTone("error");
        setMessage(await parseClientApiError(response, "저장 중 오류가 발생했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        return;
      }

      setMessageTone("success");
      setMessage("관리 정보가 저장되었습니다.");
      router.refresh();
    });
  }

  function selectQuickStatus(nextStatus: InquiryStatus) {
    setStatus(nextStatus);
    setMessage("");
  }

  function applyStatusNotePreset(value: string) {
    setStatusChangeNote(value);
    setMessage("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldGroup>
        <Field label="상태">
          <Select value={status} onChange={(event) => setStatus(event.target.value as InquiryStatus)}>
            {inquiryStatusValues.map((value) => (
              <option key={value} value={value}>
                {inquiryStatusLabels[value].ko}
              </option>
            ))}
          </Select>
          {quickStatuses.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {quickStatuses.map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={value === status ? "primary" : "secondary"}
                  onClick={() => selectQuickStatus(value)}
                  disabled={isPending}
                >
                  {inquiryStatusLabels[value].ko}
                </Button>
              ))}
            </div>
          ) : null}
          {statusChanged ? (
            <Card muted className="mt-4 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">상태 변경 확인</p>
              <p className="mt-2 text-sm text-text">
                {inquiryStatusLabels[initialStatus].ko} → {inquiryStatusLabels[status].ko}
              </p>
              {requiresStatusChangeNote ? (
                <div className="mt-3">
                  <Textarea
                    rows={3}
                    value={statusChangeNote}
                    onChange={(event) => setStatusChangeNote(event.target.value)}
                    placeholder="상태 변경 사유를 6자 이상 입력해 주세요."
                  />
                  {(statusNotePresets[status]?.length ?? 0) > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {statusNotePresets[status]?.map((preset, index) => (
                        <Button
                          key={`${status}-preset-${preset}`}
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => applyStatusNotePreset(preset)}
                          disabled={isPending}
                        >
                          사유 {index + 1}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  {(statusNotePresets[status]?.length ?? 0) > 0 ? (
                    <div className="mt-2 space-y-1 text-xs text-text-muted">
                      {statusNotePresets[status]?.map((preset) => (
                        <p key={`status-note-${status}-${preset}`}>• {preset}</p>
                      ))}
                    </div>
                  ) : null}
                  {statusChangeNoteTrimmed.length > 0 && statusChangeNoteTrimmed.length < 6 ? (
                    <p className="mt-2 text-xs text-amber-700">변경 사유를 조금 더 구체적으로 입력해 주세요.</p>
                  ) : null}
                </div>
              ) : null}
              {requiresHighImpactConfirm ? (
                <label className="mt-3 flex items-start gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={statusConfirmChecked}
                    onChange={(event) => setStatusConfirmChecked(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-line"
                  />
                  <span>고위험 상태 전환임을 확인했고, 저장 전에 검토를 마쳤습니다.</span>
                </label>
              ) : null}
            </Card>
          ) : null}
          {statusGuardPreview.length > 0 ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-line bg-surface-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">상태 전환 체크</p>
              {statusGuardPreview.map((item) => (
                <div key={item.status} className="rounded-xl border border-line bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-text-strong">{item.label}</p>
                    <span className={`text-xs font-semibold ${item.allowed ? "text-emerald-700" : "text-amber-700"}`}>
                      {item.allowed ? "바로 전환 가능" : "확인 필요"}
                    </span>
                  </div>
                  {!item.allowed && item.blockers.length > 0 ? (
                    <p className="mt-1 text-xs text-text-muted">{item.blockers[0]}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </Field>
        <Field label="내부 메모" hint="고객에게 보이지 않는 관리자 메모입니다.">
          <Textarea
            rows={8}
            value={internalMemo}
            onChange={(event) => setInternalMemo(event.target.value)}
            placeholder="상담 시 확인할 사항, 견적 체크 포인트, 후속 조치 메모를 기록합니다."
          />
        </Field>
      </FieldGroup>
      {message ? <StateInline tone={messageTone}>{message}</StateInline> : null}
      <Button type="submit" disabled={isSubmitDisabled} fullWidth>
        {isPending ? "저장 중..." : "관리 정보 저장"}
      </Button>
    </form>
  );
}
