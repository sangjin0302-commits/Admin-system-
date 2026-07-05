"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Decision = {
  id: string;
  at: string;
  type: "spend_increase" | "spend_decrease" | "pause" | "copy_variant" | "resume";
  campaign: string;
  rationale: string;
  suggestedValue?: string | number;
  confidence: number;
  status: "pending" | "applied" | "rejected" | "auto_applied";
};

type AutoApply = Record<Decision["type"], boolean>;

const TYPES: Array<{ key: Decision["type"]; label: string }> = [
  { key: "spend_increase", label: "예산 증액" },
  { key: "spend_decrease", label: "예산 감액" },
  { key: "pause", label: "일시중지" },
  { key: "copy_variant", label: "카피 변형" },
  { key: "resume", label: "재개" },
];

export default function AdminAutoMarketingPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [autoApply, setAutoApply] = useState<AutoApply | null>(null);
  const [trust, setTrust] = useState<number>(0.75);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/auto-marketing", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "조회 실패");
      else {
        setDecisions(data.decisions ?? []);
        setAutoApply(data.autoApply ?? null);
        setTrust(data.trustThreshold ?? 0.75);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runCycle = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/auto-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_cycle" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }, [load]);

  const decide = useCallback(
    async (id: string, decision: "apply" | "reject") => {
      await fetch("/api/admin/auto-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decide", id, decision }),
      });
      await load();
    },
    [load]
  );

  const toggleAuto = useCallback(
    async (type: Decision["type"], next: boolean) => {
      await fetch("/api/admin/auto-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_auto_apply", config: { [type]: next } }),
      });
      await load();
    },
    [load]
  );

  const setTrustValue = useCallback(
    async (v: number) => {
      await fetch("/api/admin/auto-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_trust", value: v }),
      });
      await load();
    },
    [load]
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">자율 마케팅 캠페인</h1>
        <Button onClick={runCycle} disabled={busy}>
          {busy ? "실행 중..." : "결정 사이클 실행"}
        </Button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Card className="p-4">
        <div className="text-xs text-gray-500 mb-2">
          신뢰도 임계값 (현재 {trust.toFixed(2)}) — 값 이상 확신도만 자동 적용
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          defaultValue={trust}
          onChange={(e) => setTrustValue(Number(e.target.value))}
          className="w-full"
        />
      </Card>
      <Card className="p-4">
        <div className="text-sm font-medium mb-2">자동 적용 토글</div>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoApply?.[t.key] ?? false}
                onChange={(e) => toggleAuto(t.key, e.target.checked)}
              />
              {t.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          TODO: Google/Naver Ads API OAuth 연동 시 실제 자동 적용. 현재는 결정 기록만 저장.
        </p>
      </Card>
      <section>
        <h2 className="text-lg font-medium mb-2">자율 결정 로그</h2>
        <div className="space-y-2">
          {decisions.length === 0 ? (
            <div className="text-sm text-gray-500">기록 없음 — 사이클 실행 필요</div>
          ) : (
            decisions.map((d) => (
              <Card key={d.id} className="p-3 text-sm">
                <div className="flex justify-between">
                  <span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded mr-2">{d.type}</span>
                    <span className="font-medium">{d.campaign}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(d.at).toLocaleString("ko-KR")} · {(d.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-700 mt-1">{d.rationale}</div>
                {d.suggestedValue !== undefined && (
                  <div className="text-xs text-blue-600 mt-1">제안: {String(d.suggestedValue)}</div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      d.status === "applied" || d.status === "auto_applied"
                        ? "bg-green-100 text-green-700"
                        : d.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {d.status}
                  </span>
                  {d.status === "pending" && (
                    <div className="flex gap-2 ml-auto">
                      <Button size="sm" onClick={() => decide(d.id, "apply")}>
                        적용
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => decide(d.id, "reject")}>
                        거절
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
