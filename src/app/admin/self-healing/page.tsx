"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type HealRecord = {
  id: string;
  at: string;
  errorMessage: string;
  matchedPattern: string | null;
  action: string;
  healed: boolean;
  aiSuggestion?: string;
  status: "auto_healed" | "pending_review" | "ignored";
};

type Stats = {
  total: number;
  autoHealed: number;
  pending: number;
  successRate: number;
};

export default function AdminSelfHealingPage() {
  const [log, setLog] = useState<HealRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/self-healing", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "조회 실패");
      else {
        setLog(data.log ?? []);
        setStats(data.stats ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runScan = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/self-healing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }, [load]);

  const apply = useCallback(
    async (id: string, status: HealRecord["status"]) => {
      await fetch("/api/admin/self-healing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", id, status }),
      });
      await load();
    },
    [load]
  );

  const healed = log.filter((r) => r.status === "auto_healed");
  const pending = log.filter((r) => r.status === "pending_review");

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">자가 치유 시스템</h1>
        <Button onClick={runScan} disabled={busy}>
          {busy ? "스캔 중..." : "지금 스캔"}
        </Button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-xs text-gray-500">전체</div>
            <div className="text-2xl">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-gray-500">자동 복구</div>
            <div className="text-2xl text-green-600">{stats.autoHealed}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-gray-500">검토 대기</div>
            <div className="text-2xl text-orange-600">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-gray-500">성공률</div>
            <div className="text-2xl">{stats.successRate}%</div>
          </Card>
        </div>
      )}
      <section>
        <h2 className="text-lg font-medium mb-2">최근 자동 복구</h2>
        <div className="space-y-2">
          {loading ? (
            <div className="text-sm text-gray-500">로딩...</div>
          ) : healed.length === 0 ? (
            <div className="text-sm text-gray-500">기록 없음</div>
          ) : (
            healed.slice(0, 10).map((r) => (
              <Card key={r.id} className="p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-mono text-xs">{r.matchedPattern}</span>
                  <span className="text-xs text-gray-500">{new Date(r.at).toLocaleString("ko-KR")}</span>
                </div>
                <div className="text-xs text-gray-700 mt-1">{r.errorMessage}</div>
                <div className="text-xs text-green-600 mt-1">액션: {r.action}</div>
              </Card>
            ))
          )}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-medium mb-2">AI 제안 대기 큐</h2>
        <div className="space-y-2">
          {pending.length === 0 ? (
            <div className="text-sm text-gray-500">대기 없음</div>
          ) : (
            pending.map((r) => (
              <Card key={r.id} className="p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">{new Date(r.at).toLocaleString("ko-KR")}</span>
                </div>
                <div className="text-xs text-gray-700 mt-1">{r.errorMessage}</div>
                {r.aiSuggestion && (
                  <div className="text-xs text-blue-600 mt-2 whitespace-pre-wrap">
                    AI 제안: {r.aiSuggestion}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => apply(r.id, "auto_healed")}>
                    적용
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => apply(r.id, "ignored")}>
                    무시
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
