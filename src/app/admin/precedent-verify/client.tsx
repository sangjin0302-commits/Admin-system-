"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PrecedentLiveResult } from "@/lib/services/precedent-live-verifier";

type Stats = { total: number; failures: number; valid: number; oldest?: string };

export default function PrecedentVerifyClient({
  stats: initialStats,
  failures: initialFailures,
  enabled,
}: {
  stats: Stats;
  failures: PrecedentLiveResult[];
  enabled: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<PrecedentLiveResult[]>([]);
  const [stats, setStats] = useState(initialStats);
  const [failures, setFailures] = useState(initialFailures);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/admin/precedent-verify");
    const data = await res.json();
    if (data.ok) {
      setStats(data.stats);
      setFailures(data.failures);
    }
  }

  async function runBatch(skipCache: boolean) {
    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch("/api/admin/precedent-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, skipCache }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "실패");
      else {
        setResults(data.results);
        await reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  async function clearCache() {
    await fetch("/api/admin/precedent-verify", { method: "DELETE" });
    await reload();
  }

  function badgeClass(s: string): string {
    if (s === "valid") return "bg-emerald-100 text-emerald-700";
    if (s === "abolished") return "bg-rose-100 text-rose-700";
    if (s === "changed") return "bg-amber-100 text-amber-700";
    return "bg-surface-muted text-text-muted";
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 text-xs md:grid-cols-4">
          <div>
            <p className="text-text-muted">캐시 총계</p>
            <p className="text-lg font-semibold text-text-strong">{stats.total}</p>
          </div>
          <div>
            <p className="text-text-muted">유효</p>
            <p className="text-lg font-semibold text-emerald-700">{stats.valid}</p>
          </div>
          <div>
            <p className="text-text-muted">실패·폐기</p>
            <p className="text-lg font-semibold text-rose-700">{stats.failures}</p>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" size="sm" onClick={clearCache}>
              캐시 초기화
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium text-text-strong">배치 검증</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="판례 번호가 포함된 텍스트를 붙여넣으세요 (예: 대법원 2018두12345)"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-xs"
        />
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => runBatch(false)}
            disabled={busy || !enabled || !text.trim()}
          >
            {busy ? "검증 중..." : "검증 실행"}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => runBatch(true)}
            disabled={busy || !enabled || !text.trim()}
          >
            캐시 무시 재검증
          </Button>
          {!enabled && <span className="text-xs text-rose-700">플래그 off</span>}
        </div>
        {error && (
          <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}
        {results.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded border border-line p-2">
                <span className={"rounded px-1.5 py-0.5 font-semibold " + badgeClass(r.currentStatus)}>
                  {r.currentStatus}
                </span>
                <span className="flex-1">
                  <span className="font-mono">{r.caseNo}</span>
                  <span className="ml-2 text-text-muted">
                    {r.source} · {r.note ?? ""}
                  </span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="ml-2 text-primary underline">
                      원문
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium text-text-strong">최근 실패·폐기</p>
        {failures.length === 0 ? (
          <p className="text-xs text-text-muted">기록 없음</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {failures.map((f, i) => (
              <li key={i} className="flex items-start gap-2 rounded border border-line p-2">
                <span className={"rounded px-1.5 py-0.5 font-semibold " + badgeClass(f.currentStatus)}>
                  {f.currentStatus}
                </span>
                <span className="flex-1">
                  <span className="font-mono">{f.caseNo}</span>
                  <span className="ml-2 text-text-muted">
                    {new Date(f.lastVerified).toLocaleString("ko-KR")} · {f.source}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
