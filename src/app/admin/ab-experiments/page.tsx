"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";

type ExperimentResult = {
  name: string;
  views: number;
  conversions: number;
  rate: number;
  share: number;
};

type Experiment = {
  key: string;
  name: string;
  variants: string[];
  weights: number[];
  active: boolean;
  totalViews: number;
  results: ExperimentResult[];
  winner?: string;
};

export default function ABExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ab-experiments", { cache: "no-store" });
      const data = (await res.json()) as { experiments?: Experiment[]; error?: string };
      if (!res.ok) setError(data.error ?? "실험 목록 로드 실패");
      else setExperiments(data.experiments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePause(exp: Experiment) {
    setBusyKey(exp.key);
    try {
      const res = await fetch("/api/admin/ab-experiments", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: exp.key, paused: exp.active }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "상태 변경 실패");
      } else {
        await load();
      }
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Marketing"
        title="A/B 실험 GUI"
        description="등록된 실험의 변형 분포·전환율 확인 및 일시정지 토글, 신규 실험 생성."
        action={
          <Link
            href="/admin/ab-experiments/new"
            className="rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            + 신규 실험
          </Link>
        }
      />

      {error && (
        <Card className="p-4 text-sm text-red-600">
          <p>{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-5 text-sm text-text-muted">불러오는 중…</Card>
      ) : experiments.length === 0 ? (
        <Card className="p-5 text-sm text-text-muted">등록된 실험이 없습니다.</Card>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp) => (
            <Card key={exp.key} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-text-strong">{exp.name}</h2>
                  <p className="text-xs text-text-muted">
                    <code>{exp.key}</code> · {exp.totalViews} views · {exp.variants.length} variants
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      exp.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {exp.active ? "활성" : "일시정지"}
                  </span>
                  {exp.winner && (
                    <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">
                      선두: {exp.winner}
                    </span>
                  )}
                  <button
                    onClick={() => togglePause(exp)}
                    disabled={busyKey === exp.key}
                    className="rounded border border-line px-3 py-1 text-xs disabled:opacity-50"
                  >
                    {exp.active ? "일시정지" : "재개"}
                  </button>
                </div>
              </div>

              <table className="mt-4 w-full text-xs">
                <thead className="text-text-muted">
                  <tr className="text-left">
                    <th className="py-1">Variant</th>
                    <th className="py-1">분포</th>
                    <th className="py-1">Views</th>
                    <th className="py-1">Conv.</th>
                    <th className="py-1">전환율</th>
                  </tr>
                </thead>
                <tbody>
                  {exp.results.map((v) => (
                    <tr key={v.name} className="border-t border-line">
                      <td className="py-2 font-medium">{v.name}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded bg-slate-100">
                            <div
                              className="h-full bg-slate-500"
                              style={{ width: `${Math.round(v.share * 100)}%` }}
                            />
                          </div>
                          <span>{(v.share * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2">{v.views}</td>
                      <td className="py-2">{v.conversions}</td>
                      <td className="py-2">{(v.rate * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
