"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

type Label = "분노" | "좌절" | "실망" | "만족" | "안심" | "혼란" | "중립";

interface EmotionEntry {
  emotion: Label;
  intensity: number;
  suggestedTone: string;
  reasoning: string;
  at: string;
}

interface Trace {
  entries: EmotionEntry[];
  current: EmotionEntry | null;
  alert: null | { level: "warn" | "critical"; message: string };
}

const EMOTION_ORDER: Label[] = ["분노", "좌절", "실망", "혼란", "중립", "안심", "만족"];
const EMOTION_COLOR: Record<Label, string> = {
  분노: "#dc2626",
  좌절: "#f97316",
  실망: "#f59e0b",
  혼란: "#6366f1",
  중립: "#94a3b8",
  안심: "#22c55e",
  만족: "#059669",
};

function emotionY(label: Label): number {
  const idx = EMOTION_ORDER.indexOf(label);
  return idx / (EMOTION_ORDER.length - 1); // 0-1
}

function TrendSvg({ entries }: { entries: EmotionEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-xs text-text-muted">감정 추적 데이터가 없습니다.</p>;
  }
  const w = 320;
  const h = 80;
  const pad = 8;
  const pts = entries.map((e, i) => {
    const x = pad + ((w - pad * 2) * i) / Math.max(1, entries.length - 1);
    const y = pad + (h - pad * 2) * (1 - emotionY(e.emotion)) * (0.5 + 0.5 * e.intensity);
    return { x, y, e };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full max-w-full">
      <path d={path} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={EMOTION_COLOR[p.e.emotion]}>
          <title>{`${p.e.emotion} (${Math.round(p.e.intensity * 100)}%)`}</title>
        </circle>
      ))}
    </svg>
  );
}

export function EmotionTrendChart({ inquiryId }: { inquiryId: string }) {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${inquiryId}/emotion`);
      const json = await res.json();
      if (!res.ok || !json.ok) setErr(json.error ?? "조회 실패");
      else setTrace(json.trace);
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    load();
  }, [load]);

  const current = trace?.current ?? null;
  const badgeColor = current ? EMOTION_COLOR[current.emotion] : "#94a3b8";

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="ui-kicker">고객 감정 흐름</p>
          <p className="text-xs text-text-muted">메시지 수신마다 자동 갱신</p>
        </div>
        <button className="rounded border px-2 py-1 text-xs" onClick={load} disabled={loading}>
          새로고침
        </button>
      </div>

      {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}

      <div className="mt-3 flex items-center gap-2">
        <span
          className="rounded-full border px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${badgeColor}20`, borderColor: badgeColor, color: badgeColor }}
        >
          {current?.emotion ?? "-"} {current ? `· ${Math.round(current.intensity * 100)}%` : ""}
        </span>
        {trace?.alert ? (
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              trace.alert.level === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {trace.alert.message}
          </span>
        ) : null}
      </div>

      <div className="mt-3">{trace ? <TrendSvg entries={trace.entries} /> : null}</div>

      {current ? (
        <div className="mt-2 rounded bg-surface-muted p-2 text-xs">
          <p className="font-medium">권장 응대 톤</p>
          <p>{current.suggestedTone}</p>
        </div>
      ) : null}
    </Card>
  );
}
