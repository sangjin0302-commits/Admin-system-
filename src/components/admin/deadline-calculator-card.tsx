"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { calculateAllApplicableDeadlines } from "@/lib/services/deadline-calculator";

type Props = {
  defaultCategory?: string | null;
};

const CATEGORY_OPTIONS = [
  { value: "ADMIN_APPEAL", label: "행정심판/행정소송" },
  { value: "VISA_STAY", label: "체류/비자" },
  { value: "LICENSE_PERMIT", label: "인허가" },
  { value: "CONTRACT_INVESTIGATION", label: "계약/조사" },
  { value: "CORPORATE_SETUP", label: "법인설립" },
  { value: "DEFAULT", label: "기타" }
];

function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatGoogleCalendarDate(d: Date): string {
  // YYYYMMDD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function toneForDays(days: number): string {
  if (days < 0) return "border-red-300 bg-red-50 text-red-700";
  if (days < 7) return "border-red-300 bg-red-50 text-red-700";
  if (days < 30) return "border-yellow-300 bg-yellow-50 text-yellow-800";
  return "border-green-300 bg-green-50 text-green-700";
}

function buildGoogleCalendarUrl(label: string, deadline: Date, basis: string): string {
  const start = formatGoogleCalendarDate(deadline);
  const end = formatGoogleCalendarDate(
    new Date(deadline.getTime() + 24 * 60 * 60 * 1000)
  );
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `[기한] ${label}`,
    dates: `${start}/${end}`,
    details: basis
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function DeadlineCalculatorCard({ defaultCategory }: Props) {
  const [dispositionDate, setDispositionDate] = useState<string>(
    formatIsoDate(new Date())
  );
  const [category, setCategory] = useState<string>(
    defaultCategory?.toUpperCase() ?? "ADMIN_APPEAL"
  );

  const results = useMemo(() => {
    if (!dispositionDate) return [];
    const d = new Date(dispositionDate);
    if (Number.isNaN(d.getTime())) return [];
    return calculateAllApplicableDeadlines(d, category);
  }, [dispositionDate, category]);

  return (
    <Card className="p-5">
      <p className="ui-kicker">자동 기한 계산</p>
      <p className="mt-1 text-xs text-text-muted">
        처분일과 사건 카테고리를 입력하면 관련 법정기한을 자동으로 계산합니다.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-text">처분일</label>
          <Input
            type="date"
            value={dispositionDate}
            onChange={(e) => setDispositionDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-text">카테고리</label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {results.length === 0 ? (
          <p className="text-sm text-text-muted">처분일을 입력해 주세요.</p>
        ) : (
          results.map((r) => {
            const tone = toneForDays(r.daysRemaining);
            const gcalUrl = buildGoogleCalendarUrl(r.label, r.deadline, r.basis);
            const dateStr = formatIsoDate(r.deadline);
            const copyText = `${r.label}: ${dateStr} (${r.basis})`;

            return (
              <div
                key={r.type}
                className="rounded-md border border-line bg-surface p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{r.label}</p>
                    <p className="text-xs text-text-muted">{r.basis}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                      tone
                    )}
                  >
                    {r.isExpired
                      ? `${Math.abs(r.daysRemaining)}일 경과`
                      : `D-${r.daysRemaining}`}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-text-muted">기한:</span>
                  <span className="font-semibold text-text">{dateStr}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={gcalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-md border border-line bg-white px-3 py-1 text-xs font-semibold text-text hover:bg-surface-muted"
                  >
                    Google Calendar에 등록
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        void navigator.clipboard.writeText(copyText);
                      }
                    }}
                  >
                    캘린더에 추가 (복사)
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
