"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DeadlineType } from "@/lib/services/deadline-calculator";

type TypeInfo = { type: DeadlineType; label: string; days: number; basis: string; specialLaw?: string };

type CalcRow = {
  type: DeadlineType;
  label: string;
  basis: string;
  specialLaw?: string;
  deadline: string;
  originalDeadline?: string;
  daysRemaining: number;
  holidayAdjusted?: boolean;
  holidayShiftDays?: number;
  holidayShiftReason?: string;
  holidaysInPeriod?: Array<{ date: string; name: string }>;
};

export default function DeadlineCalculatorClient({
  types,
  holidayAware,
}: {
  types: TypeInfo[];
  holidayAware: boolean;
}) {
  const [disposition, setDisposition] = useState(() => new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState<DeadlineType>("ADMIN_APPEAL");
  const [rows, setRows] = useState<CalcRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  async function runCalc() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/deadline-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dispositionDate: disposition,
          types: showAll ? types.map((t) => t.type) : [selected],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "계산 실패");
      } else {
        setRows(data.rows);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-strong">처분 통지일</label>
            <input
              type="date"
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-strong">시나리오</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value as DeadlineType)}
              disabled={showAll}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              {types.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label} ({t.days}일) {t.specialLaw ? `· ${t.specialLaw}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              전체 시나리오
            </label>
            <Button variant="primary" size="md" onClick={runCalc} disabled={busy}>
              {busy ? "계산 중..." : "계산"}
            </Button>
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}
      </Card>

      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.type} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-strong">
                    {r.label}
                    {r.specialLaw && (
                      <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">
                        {r.specialLaw}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted">{r.basis}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-text-strong">
                    {new Date(r.deadline).toLocaleDateString("ko-KR")}
                  </p>
                  <p className={`text-xs ${r.daysRemaining < 0 ? "text-rose-700" : "text-text-muted"}`}>
                    {r.daysRemaining < 0
                      ? `${Math.abs(r.daysRemaining)}일 지남`
                      : `D-${r.daysRemaining}`}
                  </p>
                </div>
              </div>
              {r.holidayAdjusted && (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                  <p>
                    <b>휴일 {r.holidayShiftDays}일 반영됨</b>
                    {r.holidayShiftReason && ` — ${r.holidayShiftReason}`}
                    {r.originalDeadline && (
                      <span className="ml-1">
                        (원래 {new Date(r.originalDeadline).toLocaleDateString("ko-KR")} →{" "}
                        {new Date(r.deadline).toLocaleDateString("ko-KR")} 순연)
                      </span>
                    )}
                  </p>
                </div>
              )}
              {holidayAware && r.holidaysInPeriod && r.holidaysInPeriod.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer text-text-muted">
                    계산 기간 내 공휴일 {r.holidaysInPeriod.length}건
                  </summary>
                  <ul className="mt-1 list-disc pl-5 text-text-muted">
                    {r.holidaysInPeriod.map((h) => (
                      <li key={h.date}>
                        {h.date} · {h.name}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
