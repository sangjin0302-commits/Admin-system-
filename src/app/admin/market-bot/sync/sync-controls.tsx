"use client";

import { useState } from "react";
import toast from "react-hot-toast";

type Action = {
  id: string;
  label: string;
  description?: string;
  confirm?: string;
};

const QUICK_ACTIONS: Action[] = [
  { id: "collect-naver", label: "네이버 수집 (일반)" },
  { id: "collect-market", label: "네이버 수집 (시장)" },
  { id: "collect-trends", label: "네이버 수집 (트렌드)" },
  { id: "full-sync", label: "전체 동기화", confirm: "전체 동기화를 실행하시겠습니까?" },
  { id: "reindex", label: "재인덱싱", confirm: "재인덱싱을 실행하시겠습니까?" },
];

const FULL_ACTIONS: Action[] = [
  ...QUICK_ACTIONS,
  { id: "sync-notion", label: "Notion 동기화", confirm: "Notion 동기화를 실행하시겠습니까?" },
];

async function runAction(id: string): Promise<void> {
  const res = await fetch(`/api/admin/market-bot/proxy/${id}`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
}

function ActionButton({ action, busy, onRun }: { action: Action; busy: string | null; onRun: (a: Action) => void }) {
  const isBusy = busy === action.id;
  return (
    <button
      onClick={() => onRun(action)}
      disabled={busy !== null}
      className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-text-strong hover:border-primary disabled:opacity-50"
    >
      {isBusy ? "실행 중..." : action.label}
    </button>
  );
}

function useRunner() {
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (action: Action) => {
    if (action.confirm && !window.confirm(action.confirm)) return;
    setBusy(action.id);
    try {
      await runAction(action.id);
      toast.success(`${action.label} 완료`);
    } catch (err) {
      toast.error(`${action.label} 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

export function QuickSyncActions() {
  const { busy, run } = useRunner();
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_ACTIONS.map((a) => (
        <ActionButton key={a.id} action={a} busy={busy} onRun={run} />
      ))}
    </div>
  );
}

export function FullSyncControls() {
  const { busy, run } = useRunner();
  return (
    <div className="flex flex-wrap gap-2">
      {FULL_ACTIONS.map((a) => (
        <ActionButton key={a.id} action={a} busy={busy} onRun={run} />
      ))}
    </div>
  );
}
