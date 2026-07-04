"use client";

import { useState } from "react";

import type {
  AvailabilityConfig,
  WeekdayKey,
} from "@/lib/services/consultation-slots-service";

const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: "mon", label: "월요일" },
  { key: "tue", label: "화요일" },
  { key: "wed", label: "수요일" },
  { key: "thu", label: "목요일" },
  { key: "fri", label: "금요일" },
  { key: "sat", label: "토요일" },
  { key: "sun", label: "일요일" },
];

export function ConsultAvailabilityForm({ initial }: { initial: AvailabilityConfig }) {
  const [weekly, setWeekly] = useState<Record<WeekdayKey, string>>(() => {
    const map = {} as Record<WeekdayKey, string>;
    for (const w of WEEKDAYS) {
      map[w.key] = (initial.weeklyPattern[w.key] ?? []).join(", ");
    }
    return map;
  });
  const [blocked, setBlocked] = useState<string>(initial.blockedDates.join("\n"));
  const [duration, setDuration] = useState<number>(initial.slotDurationMin);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setStatus("saving");
    const weeklyPattern = {} as Record<WeekdayKey, string[]>;
    for (const w of WEEKDAYS) {
      weeklyPattern[w.key] = weekly[w.key]
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter((t) => /^\d{2}:\d{2}$/.test(t));
    }
    const blockedDates = blocked
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t));

    try {
      const res = await fetch("/api/admin/consult-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeklyPattern,
          blockedDates,
          slotDurationMin: duration,
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-text-strong">요일별 시간대</h3>
        <p className="mt-1 text-xs text-text-muted">
          시간은 <code>HH:mm</code> 형식으로 콤마 구분해 입력하세요. 예: <code>10:00, 11:00, 14:00</code>. 비우면 해당 요일은 예약 불가.
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {WEEKDAYS.map((w) => (
            <label key={w.key} className="block">
              <span className="text-xs font-semibold text-text-strong">{w.label}</span>
              <input
                value={weekly[w.key]}
                onChange={(e) =>
                  setWeekly((prev) => ({ ...prev, [w.key]: e.target.value }))
                }
                placeholder="10:00, 11:00, 14:00, 15:00, 16:00"
                className="mt-1 h-10 w-full rounded-md border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-text-strong">차단 날짜</h3>
        <p className="mt-1 text-xs text-text-muted">
          <code>YYYY-MM-DD</code> 형식으로 한 줄에 하나씩. 예: <code>2026-07-15</code>
        </p>
        <textarea
          value={blocked}
          onChange={(e) => setBlocked(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <h3 className="text-base font-semibold text-text-strong">슬롯 길이 (분)</h3>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(Math.max(5, Number(e.target.value) || 30))}
          className="mt-2 h-10 w-40 rounded-md border border-line bg-surface px-3 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-text-muted">기록용 (현재는 요일별 명시된 시간이 그대로 노출됩니다).</p>
      </div>

      <div className="flex items-center gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-[#143d5d] disabled:opacity-50"
        >
          {status === "saving" ? "저장 중…" : "저장하기"}
        </button>
        {status === "saved" && <span className="text-sm font-semibold text-emerald-600">✓ 저장되었습니다</span>}
        {status === "error" && <span className="text-sm font-semibold text-rose-600">저장 실패</span>}
      </div>
    </div>
  );
}
