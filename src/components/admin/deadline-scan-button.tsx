"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeadlineScanButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onClick() {
    setMsg(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/deadline-scan", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setMsg(`실패: ${data.error ?? "오류"}`);
        return;
      }
      setMsg(`스캔 ${data.scanned}건, 임박 ${data.hits.length}건, 새 알림 ${data.createdTasks}건`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="inline-flex h-10 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold text-text-strong transition hover:border-line-strong hover:bg-surface-muted disabled:opacity-50"
      >
        {isPending ? "스캔 중..." : "기한 스캔"}
      </button>
      {msg && <p className="text-xs text-text-muted">{msg}</p>}
    </div>
  );
}
