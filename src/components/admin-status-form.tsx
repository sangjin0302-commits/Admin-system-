"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { parseClientApiError } from "@/lib/http/client-api";
import { inquiryStatusLabels, inquiryStatusValues, type InquiryStatus } from "@/types/inquiry";

const highImpactStatuses = new Set<InquiryStatus>(["WON", "CLOSED", "ON_HOLD"]);

export function AdminStatusForm({
  inquiryId,
  currentStatus,
  currentUpdatedAt
}: {
  inquiryId: string;
  currentStatus: InquiryStatus;
  currentUpdatedAt?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [statusChangeNote, setStatusChangeNote] = useState("");
  const [statusConfirmChecked, setStatusConfirmChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const statusChanged = status !== currentStatus;
  const requiresHighImpactConfirm = statusChanged && highImpactStatuses.has(status);
  const requiresStatusChangeNote = statusChanged && (requiresHighImpactConfirm || status === "WON");
  const noteTrimmed = statusChangeNote.trim();
  const submitBlocked =
    isPending ||
    (requiresHighImpactConfirm && !statusConfirmChecked) ||
    (requiresStatusChangeNote && noteTrimmed.length < 6);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (submitBlocked) {
      setMessage("필수 확인 항목을 먼저 완료해 주세요.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          statusChangeNote: statusChanged ? noteTrimmed : undefined,
          expectedUpdatedAt: currentUpdatedAt
        })
      });

      if (!response.ok) {
        setMessage(await parseClientApiError(response, "상태 변경 중 오류가 발생했습니다."));
        if (response.status === 409 && response.headers.get("X-Current-Updated-At")) {
          router.refresh();
        }
        return;
      }

      setMessage("상태가 저장되었습니다.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">관리 상태</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as InquiryStatus)}
          className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none ring-0 transition focus:border-trust"
        >
          {inquiryStatusValues.map((value) => (
            <option key={value} value={value}>
              {inquiryStatusLabels[value].ko}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitBlocked}
          className="h-11 rounded-2xl bg-ink px-5 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "저장 중..." : "상태 저장"}
        </button>
      </div>
      {statusChanged ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">
            상태 변경: {inquiryStatusLabels[currentStatus].ko} → {inquiryStatusLabels[status].ko}
          </p>
          {requiresStatusChangeNote ? (
            <textarea
              value={statusChangeNote}
              onChange={(event) => setStatusChangeNote(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              rows={3}
              placeholder="상태 변경 사유를 6자 이상 입력해 주세요."
            />
          ) : null}
          {requiresHighImpactConfirm ? (
            <label className="mt-2 flex items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={statusConfirmChecked}
                onChange={(event) => setStatusConfirmChecked(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              <span>고위험 상태 전환을 확인했고 변경 전에 검토를 마쳤습니다.</span>
            </label>
          ) : null}
        </div>
      ) : null}
      {message ? <p className="text-sm text-slate-500">{message}</p> : null}
    </form>
  );
}
