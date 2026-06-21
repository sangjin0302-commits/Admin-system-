"use client";

import { useState } from "react";
import toast from "react-hot-toast";

type ReportType = "daily-brief" | "content-brief" | "weekly-strategy" | "monthly-strategy";

const REPORTS: { id: ReportType; label: string; hasEdition?: boolean }[] = [
  { id: "daily-brief", label: "데일리 브리프", hasEdition: true },
  { id: "content-brief", label: "콘텐츠 브리프", hasEdition: true },
  { id: "weekly-strategy", label: "주간 전략" },
  { id: "monthly-strategy", label: "월간 전략" },
];

export function ReportsBrowser() {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [edition, setEdition] = useState<"morning" | "evening">("morning");

  const apiBase = process.env.NEXT_PUBLIC_MARKET_BOT_API_URL ?? "";

  const fetchReport = async (type: ReportType, ed?: string) => {
    setBusy(type + (ed ?? ""));
    try {
      const qs = ed ? `?edition=${encodeURIComponent(ed)}` : "";
      const res = await fetch(`/api/admin/market-bot/reports/${type}${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string })?.error ?? `HTTP ${res.status}`);
      setResult(data);
      toast.success("조회 완료");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-text-muted">에디션:</label>
        <select
          value={edition}
          onChange={(e) => setEdition(e.target.value as "morning" | "evening")}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
        >
          <option value="morning">morning</option>
          <option value="evening">evening</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => fetchReport(r.id, r.hasEdition ? edition : undefined)}
            disabled={busy !== null}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-text-strong hover:border-primary disabled:opacity-50"
          >
            {busy?.startsWith(r.id) ? "조회 중..." : r.label}
          </button>
        ))}
      </div>

      {apiBase && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-text-muted">PDF 직접 열기:</span>
          {REPORTS.map((r) => (
            <a
              key={r.id}
              href={`${apiBase}/api/reports/${r.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {r.label}
            </a>
          ))}
        </div>
      )}

      {result !== null && (
        <pre className="max-h-[500px] overflow-auto rounded-lg border border-line bg-surface-muted p-4 text-xs text-text-strong">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
