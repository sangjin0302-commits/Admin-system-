"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Shortcut = { target: string; count: number; label: string };
type Stats = {
  totalEvents: number;
  uniqueUsers: number;
  topPages: Shortcut[];
  hourDistribution: Record<number, number>;
};
type Suggestion = {
  currentOrder: string[];
  suggestedOrder: string[];
  rationale: string;
};

export default function AdminAdaptiveUiPage() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/adaptive-ui", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "조회 실패");
      else {
        setShortcuts(data.shortcuts ?? []);
        setStats(data.stats ?? null);
        setSuggestion(data.suggestion ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyReorg = useCallback(async () => {
    if (!suggestion) return;
    setBusy(true);
    setFlash(null);
    try {
      await fetch("/api/admin/adaptive-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply_reorg", order: suggestion.suggestedOrder }),
      });
      setFlash("네비게이션 순서가 적용되었습니다");
      await load();
    } finally {
      setBusy(false);
    }
  }, [suggestion, load]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">자가 학습 UI</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {flash && <div className="text-green-600 text-sm">{flash}</div>}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-xs text-gray-500">총 이벤트</div>
            <div className="text-2xl">{stats.totalEvents}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-gray-500">활성 관리자</div>
            <div className="text-2xl">{stats.uniqueUsers}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-gray-500">피크 시간대</div>
            <div className="text-2xl">
              {Object.entries(stats.hourDistribution)
                .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-"}
              시
            </div>
          </Card>
        </div>
      )}
      <section>
        <h2 className="text-lg font-medium mb-2">내 바로가기 (상위 5)</h2>
        <div className="flex flex-wrap gap-2">
          {shortcuts.length === 0 ? (
            <div className="text-sm text-gray-500">데이터 축적 중</div>
          ) : (
            shortcuts.map((s) => (
              <span key={s.target} className="px-3 py-1 bg-gray-100 rounded text-xs">
                {s.label} · {s.count}회
              </span>
            ))
          )}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-medium mb-2">전체 인기 페이지</h2>
        <Card className="p-4">
          <ul className="text-sm space-y-1">
            {(stats?.topPages ?? []).map((p) => (
              <li key={p.target} className="flex justify-between">
                <span className="font-mono text-xs">{p.target}</span>
                <span className="text-gray-500">{p.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">재배치 제안</h2>
          <Button onClick={applyReorg} disabled={busy || !suggestion?.suggestedOrder.length}>
            {busy ? "적용 중..." : "적용"}
          </Button>
        </div>
        {suggestion && (
          <Card className="p-4">
            <div className="text-xs text-gray-500 mb-2">{suggestion.rationale}</div>
            <ol className="text-sm list-decimal ml-5 space-y-1">
              {suggestion.suggestedOrder.map((t) => (
                <li key={t} className="font-mono text-xs">
                  {t}
                </li>
              ))}
            </ol>
          </Card>
        )}
      </section>
    </div>
  );
}
