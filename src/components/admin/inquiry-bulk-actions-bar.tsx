"use client";

/**
 * AAA5 (XX2): 문의 배치 액션 툴바.
 * 선택된 ID들에 대해 일괄 상태변경·담당자할당·읽음처리.
 *
 * 사용: 부모가 selectedIds 관리, onDone 콜백으로 갱신.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  selectedIds: string[];
  onDone?: () => void;
  onClear: () => void;
};

const STATUS_OPTIONS = [
  { value: "PRE_DIAGNOSED", label: "선진단완료" },
  { value: "WAITING_CONSULTATION", label: "상담대기" },
  { value: "CONSULTATION_REQUIRED", label: "상담필요" },
  { value: "QUOTE_SENT", label: "견적발송" },
  { value: "QUOTE_PENDING", label: "견적대기" },
  { value: "WON", label: "수주" },
  { value: "LOST", label: "실주" },
  { value: "CLOSED", label: "종결" },
];

export function InquiryBulkActionsBar({ selectedIds, onDone, onClear }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assignee, setAssignee] = useState("");

  if (selectedIds.length === 0) return null;

  const run = async (action: string, value?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries/bulk-action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action, value }),
      });
      // api.ok() 는 payload 를 그대로 내보낸다 — data 래퍼가 없다.
      // 예전에는 30건을 처리하고도 "0건 처리됨"이라 떠서, 실패한 줄 알고
      // 다시 실행하게 만드는 위험한 오해를 유발했다.
      const data = (await res.json()) as { updated?: number; error?: string };
      if (!res.ok) return toast.error(data.error ?? "실패");
      toast.success(`${data.updated ?? 0}건 처리됨`);
      onDone?.();
      onClear();
      router.refresh();
    } catch (err) {
      toast.error(`오류: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-2 rounded-lg border border-primary bg-primary-soft/30 p-2 shadow-panel">
      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
        {selectedIds.length}건 선택
      </span>
      <button
        onClick={() => run("mark_read")}
        disabled={loading}
        className="rounded-full border border-line bg-surface px-3 py-1 text-xs disabled:opacity-50"
      >
        ✅ 읽음 처리
      </button>
      <select
        onChange={(e) => e.target.value && run("status", e.target.value)}
        disabled={loading}
        defaultValue=""
        className="rounded-full border border-line bg-surface px-3 py-1 text-xs disabled:opacity-50"
      >
        <option value="">🔄 상태 변경...</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="inline-flex items-center gap-1">
        <input
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="담당자..."
          className="rounded-full border border-line bg-surface px-3 py-1 text-xs"
          disabled={loading}
        />
        <button
          onClick={() => {
            if (assignee.trim()) run("assign", assignee.trim());
          }}
          disabled={loading || !assignee.trim()}
          className="rounded-full bg-primary px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          👤 할당
        </button>
      </div>
      <button
        onClick={onClear}
        disabled={loading}
        className="ml-auto rounded-full border border-line bg-surface px-3 py-1 text-xs"
      >
        ✕ 취소
      </button>
    </div>
  );
}
