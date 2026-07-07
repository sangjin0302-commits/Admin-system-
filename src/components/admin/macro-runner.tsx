"use client";

import { useEffect, useState } from "react";
import { useFeatureFlag } from "@/lib/hooks/use-feature-flag";

type Macro = {
  id: string;
  name: string;
  description?: string;
  hotkey?: string;
  steps: unknown[];
};

/**
 * 관련 페이지(사건/문의 상세)에 표시되는 작은 매크로 실행 버튼.
 * 명령 팔레트와 별개로, 컨텍스트(caseId/inquiryId) 자동 주입.
 */
export function MacroRunner({
  caseId,
  inquiryId,
  clientEmail,
}: {
  caseId?: string;
  inquiryId?: string;
  clientEmail?: string;
}) {
  const enabled = useFeatureFlag("macro_system");
  const [open, setOpen] = useState(false);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    if (enabled === false || !open || macros.length > 0) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/macros", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (Array.isArray(data?.macros)) setMacros(data.macros);
      } catch {
        /* ignore */
      }
    })();
  }, [enabled, open, macros.length]);

  if (enabled === false) return null;

  async function run(id: string) {
    setRunning(id);
    setLastResult(null);
    try {
      const res = await fetch(`/api/admin/macros/${id}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId, inquiryId, clientEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setLastResult(`실패: ${data?.error ?? res.status}`);
      } else {
        const ok = (data.result?.results ?? []).filter((r: { ok: boolean }) => r.ok).length;
        const total = (data.result?.results ?? []).length;
        setLastResult(`완료: ${ok}/${total} 성공`);
      }
    } catch (err) {
      setLastResult(`오류: ${(err as Error).message ?? "네트워크"}`);
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-xs font-medium text-text-strong hover:bg-surface-muted"
      >
        매크로 ▾
      </button>
      {open && (
        <div className="z-10 min-w-[220px] rounded-lg border border-line bg-surface p-2 shadow-panel">
          {macros.length === 0 ? (
            <p className="p-2 text-xs text-text-muted">등록된 매크로 없음</p>
          ) : (
            <ul className="space-y-1">
              {macros.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => run(m.id)}
                    disabled={running === m.id}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs hover:bg-surface-muted disabled:opacity-50"
                  >
                    <span>{m.name}</span>
                    {m.hotkey && <span className="ml-2 font-mono text-[10px] text-text-muted">{m.hotkey}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {lastResult && <p className="mt-1 border-t border-line pt-1 text-[11px] text-text-muted">{lastResult}</p>}
        </div>
      )}
    </div>
  );
}
