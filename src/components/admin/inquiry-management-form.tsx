"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { StateInline } from "@/components/ui/state-panel";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

export function InquiryManagementForm({
  inquiryId,
  status: initialStatus,
  internalMemo: initialInternalMemo,
  quickStatuses = [],
  statusGuardPreview = []
}: {
  inquiryId: string;
  status: InquiryStatus;
  internalMemo: string | null;
  quickStatuses?: InquiryStatus[];
  statusGuardPreview?: StatusGuardPreview[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [internalMemo, setInternalMemo] = useState(initialInternalMemo ?? "");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"default" | "error" | "success">("default");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          internalMemo
        })
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string; blockers?: string[] }
          | null;
        setMessageTone("error");
        setMessage(
          result?.blockers?.length
            ? [result.error ?? "저장 중 오류가 발생했습니다.", ...result.blockers].join(" ")
            : (result?.error ?? "저장 중 오류가 발생했습니다.")
        );
        return;
      }

      setMessageTone("success");
      setMessage("관리 정보가 저장되었습니다.");
      router.refresh();
    });
  }

  function submitWithStatus(nextStatus: InquiryStatus) {
    setStatus(nextStatus);
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: nextStatus,
          internalMemo
        })
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string; blockers?: string[] }
          | null;
        setMessageTone("error");
        setMessage(
          result?.blockers?.length
            ? [result.error ?? "상태 변경 중 오류가 발생했습니다.", ...result.blockers].join(" ")
            : (result?.error ?? "상태 변경 중 오류가 발생했습니다.")
        );
        return;
      }

      setMessageTone("success");
      setMessage(`${inquiryStatusLabels[nextStatus].ko} 상태로 반영했습니다.`);
      router.refresh();
    });
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
                  onClick={() => submitWithStatus(value)}
                  disabled={isPending}
                >
                  {inquiryStatusLabels[value].ko}
                </Button>
              ))}
            </div>
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
      <Button type="submit" disabled={isPending} fullWidth>
        {isPending ? "저장 중..." : "관리 정보 저장"}
      </Button>
    </form>
  );
}
