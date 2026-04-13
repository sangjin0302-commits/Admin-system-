"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { inquiryStatusLabels, inquiryStatusValues, type InquiryStatus } from "@/types/inquiry";

export function AdminStatusForm({
  inquiryId,
  currentStatus
}: {
  inquiryId: string;
  currentStatus: InquiryStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        setMessage("상태 변경 중 오류가 발생했습니다.");
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
          disabled={isPending}
          className="h-11 rounded-2xl bg-ink px-5 text-sm font-semibold text-white transition hover:bg-trust disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "저장 중..." : "상태 저장"}
        </button>
      </div>
      {message ? <p className="text-sm text-slate-500">{message}</p> : null}
    </form>
  );
}
