"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import type { AdOptimizerReport } from "@/lib/services/ad-optimizer-service";

type Props = {
  report: AdOptimizerReport;
  spendMap: Record<string, Record<string, number>>;
  weeks: string[]; // most-recent 8 mondays (ISO date)
};

export function AdOptimizerClient({ report, spendMap, weeks }: Props) {
  const [localSpend, setLocalSpend] = useState<Record<string, Record<string, number>>>(spendMap);
  const [saving, setSaving] = useState<string | null>(null);

  async function save(campaign: string, weekStart: string, amount: number) {
    setSaving(`${campaign}::${weekStart}`);
    try {
      const res = await fetch("/api/admin/ad-optimizer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign, weekStart, amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        alert(data?.error ?? "저장 실패");
      } else {
        setLocalSpend((prev) => ({
          ...prev,
          [campaign]: { ...(prev[campaign] ?? {}), [weekStart]: amount },
        }));
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-text-strong">캠페인별 지표 · 광고비 입력</h3>
      <p className="mt-1 text-xs text-text-muted">
        각 주차별 광고 지출을 ₩ 단위로 입력하면 CPA/ROAS 가 자동으로 반영됩니다 (다음 리로드 시).
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="py-2 pr-2">캠페인</th>
              <th className="py-2 pr-2">소스/미디엄</th>
              <th className="py-2 pr-2 text-right">의뢰</th>
              <th className="py-2 pr-2 text-right">전환율</th>
              <th className="py-2 pr-2 text-right">누적 지출</th>
              <th className="py-2 pr-2 text-right">CPA</th>
              <th className="py-2 pr-2 text-right">ROAS</th>
              {weeks.map((w) => (
                <th key={w} className="py-2 pr-2 text-right">
                  {w.slice(5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 && (
              <tr>
                <td colSpan={7 + weeks.length} className="py-6 text-center text-text-muted">
                  UTM 데이터가 없습니다.
                </td>
              </tr>
            )}
            {report.rows.map((r) => (
              <tr key={r.campaign} className="border-b border-border">
                <td className="py-2 pr-2 font-semibold text-text-strong">{r.campaign}</td>
                <td className="py-2 pr-2 text-text-muted">
                  {r.source}/{r.medium}
                </td>
                <td className="py-2 pr-2 text-right">{r.inquiries}</td>
                <td className="py-2 pr-2 text-right">{(r.conversionRate * 100).toFixed(1)}%</td>
                <td className="py-2 pr-2 text-right">₩{r.spend.toLocaleString("ko-KR")}</td>
                <td className="py-2 pr-2 text-right">
                  {r.cpa ? `₩${r.cpa.toLocaleString("ko-KR")}` : "-"}
                </td>
                <td className="py-2 pr-2 text-right">{r.roas ? `${r.roas}x` : "-"}</td>
                {weeks.map((w) => {
                  const val = localSpend[r.campaign]?.[w] ?? 0;
                  const busy = saving === `${r.campaign}::${w}`;
                  return (
                    <td key={w} className="py-1 pr-1 text-right">
                      <input
                        type="number"
                        min={0}
                        defaultValue={val}
                        disabled={busy}
                        onBlur={(e) => {
                          const n = Number(e.target.value);
                          if (Number.isFinite(n) && n !== val) {
                            save(r.campaign, w, Math.max(0, Math.round(n)));
                          }
                        }}
                        className="w-24 rounded border border-border px-1 py-0.5 text-right text-[11px]"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
