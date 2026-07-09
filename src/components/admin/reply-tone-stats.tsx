"use client";

import { useEffect, useState } from "react";

type ToneStat = {
  tone: string;
  total: number;
  uniqueInquiries: number;
  won: number;
  wonRate: number;
};

const TONE_LABELS: Record<string, string> = {
  friendly: "친근",
  formal: "공식",
  practical: "실무",
};

const TONE_COLORS: Record<string, string> = {
  friendly: "bg-emerald-500",
  formal: "bg-blue-500",
  practical: "bg-amber-500",
};

export function ReplyToneStats() {
  const [stats, setStats] = useState<ToneStat[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/reply-tone-track")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setStats(d.stats);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!stats) return <div className="animate-pulse rounded-lg bg-muted p-4 h-24" />;

  const maxTotal = Math.max(...stats.map((s) => s.total), 1);

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-3">답장 톤 → WON 전환</h3>
      <div className="space-y-3">
        {stats.map((s) => (
          <div key={s.tone} className="flex items-center gap-3">
            <span className="w-10 text-xs font-medium text-muted-foreground shrink-0">
              {TONE_LABELS[s.tone] ?? s.tone}
            </span>
            <div className="flex-1 h-5 rounded bg-muted overflow-hidden relative">
              <div
                className={`h-full rounded ${TONE_COLORS[s.tone] ?? "bg-gray-500"} transition-all`}
                style={{ width: `${(s.total / maxTotal) * 100}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">
              {s.total}
            </span>
            <span className="text-xs font-bold tabular-nums w-12 text-right shrink-0">
              {s.wonRate}%
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">사용 횟수 · WON 전환율</p>
    </div>
  );
}
