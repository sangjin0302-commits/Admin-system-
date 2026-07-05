"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Action = {
  id: string;
  at: string;
  category: string;
  subject: string;
  summary: string;
  confidence: number;
  autoExecuted: boolean;
  status: "pending" | "approved" | "rolled_back" | "ignored";
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rolledBack: number;
  autoExecuted: number;
  trustScore: number;
};

export default function AdminAiStandbyPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-standby", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "조회 실패");
      else {
        setActions(data.actions ?? []);
        setStats(data.stats ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = useCallback(
    async (id: string, decision: "approve" | "rollback" | "ignore") => {
      setBusy(true);
      try {
        await fetch("/api/admin/ai-standby/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionId: id, decision }),
        });
        await load();
      } finally {
        setBusy(false);
      }
    },
    [load]
  );

  const bulkApproveAll = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/ai-standby/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: "approve_all" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }, [load]);

  const setTrust = useCallback(
    async (v: number) => {
      await fetch("/api/admin/ai-standby/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trustScore: v }),
      });
      await load();
    },
    [load]
  );

  const pending = actions.filter((a) => a.status === "pending");

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">24/7 AI 대행 · 아침 검토</h1>
        <Button onClick={bulkApproveAll} disabled={busy || pending.length === 0}>
          {pending.length}건 일괄 승인
        </Button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {stats && (
        <>
          <div className="grid grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-xs text-gray-500">전체</div>
              <div className="text-2xl">{stats.total}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">대기</div>
              <div className="text-2xl text-orange-600">{stats.pending}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">승인</div>
              <div className="text-2xl text-green-600">{stats.approved}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">롤백</div>
              <div className="text-2xl text-red-600">{stats.rolledBack}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-gray-500">자동 실행</div>
              <div className="text-2xl">{stats.autoExecuted}</div>
            </Card>
          </div>
          <Card className="p-4">
            <div className="text-xs text-gray-500 mb-2">
              신뢰도 임계값 (현재 {stats.trustScore.toFixed(2)}) — 값 이상 확신도만 자동 실행
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              defaultValue={stats.trustScore}
              onChange={(e) => setTrust(Number(e.target.value))}
              className="w-full"
            />
          </Card>
        </>
      )}
      <section>
        <h2 className="text-lg font-medium mb-2">간밤 액션 로그</h2>
        <div className="space-y-2">
          {actions.length === 0 ? (
            <div className="text-sm text-gray-500">기록 없음</div>
          ) : (
            actions.map((a) => (
              <Card key={a.id} className="p-3 text-sm">
                <div className="flex justify-between">
                  <span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded mr-2">{a.category}</span>
                    <span className="font-medium">{a.subject}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(a.at).toLocaleString("ko-KR")} · 확신도 {(a.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{a.summary}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      a.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : a.status === "rolled_back"
                        ? "bg-red-100 text-red-700"
                        : a.status === "ignored"
                        ? "bg-gray-200 text-gray-600"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {a.status}
                  </span>
                  {a.autoExecuted && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      자동 실행됨
                    </span>
                  )}
                  {a.status === "pending" && (
                    <div className="flex gap-2 ml-auto">
                      <Button size="sm" onClick={() => decide(a.id, "approve")} disabled={busy}>
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => decide(a.id, "rollback")}
                        disabled={busy}
                      >
                        롤백
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => decide(a.id, "ignore")}
                        disabled={busy}
                      >
                        무시
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
