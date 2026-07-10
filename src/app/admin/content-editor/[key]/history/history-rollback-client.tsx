"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

type HistoryEntry = { value: string; at: string; editor: string | null };

export function HistoryRollbackClient({
  contentKey,
  currentValue,
  history
}: {
  contentKey: string;
  currentValue: string;
  history: HistoryEntry[];
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  async function rollback(idx: number, value: string) {
    if (!confirm("이 버전으로 롤백하시겠습니까?")) return;
    setBusy(idx);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/content/${encodeURIComponent(contentKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data?.error ?? "롤백 실패");
      } else {
        setMessage("롤백 완료. 새로고침하세요.");
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (history.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-text-muted">히스토리가 없습니다.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-text-strong">과거 버전</h2>
      {message && <p className="mt-2 text-xs text-primary">{message}</p>}
      <ul className="mt-3 space-y-3">
        {history.map((entry, idx) => {
          const isCurrent = entry.value === currentValue;
          return (
            <li key={`${entry.at}-${idx}`} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-text-muted">
                  <span>{new Date(entry.at).toLocaleString("ko-KR")}</span>
                  {entry.editor && <span className="ml-2">· {entry.editor}</span>}
                  {isCurrent && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">현재</span>}
                </div>
                <button
                  type="button"
                  disabled={busy !== null || isCurrent}
                  onClick={() => rollback(idx, entry.value)}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  {busy === idx ? "롤백 중…" : "롤백"}
                </button>
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-text-strong">
{entry.value.slice(0, 500)}{entry.value.length > 500 ? "…" : ""}
              </pre>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
