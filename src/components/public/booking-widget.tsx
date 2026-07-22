"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Cal.com 스타일 예약 위젯 — 14일 캘린더 + 시간 슬롯 + 접수 폼.
 *
 * API: GET /api/public/booking → { days: DayAvailability[] }
 *      GET /api/public/booking?date=YYYY-MM-DD → { slots: TimeSlot[] }
 *      POST /api/public/booking { date, time, name, phone, category, message }
 */

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  weekday: string;
  slots: TimeSlot[];
}

const WEEKDAY_KO: Record<string, string> = {
  sun: "일",
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
};

const CATEGORIES = [
  "비자 · 외국인 체류",
  "행정심판",
  "계약서 · 사실조사",
  "인허가",
  "법인 설립",
  "기타",
];

function formatKoreanDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

export function BookingWidget() {
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/booking", { cache: "no-store" });
        const json = (await res.json()) as { ok?: boolean; days?: DayAvailability[] };
        if (cancelled) return;
        setDays(json.ok && Array.isArray(json.days) ? json.days : []);
      } catch {
        if (!cancelled) setDays([]);
      } finally {
        if (!cancelled) setLoadingDays(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentDay = useMemo(
    () => days.find((d) => d.date === selectedDate) ?? null,
    [days, selectedDate],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDate || !selectedTime) {
      setResult("error");
      setErrorMsg("날짜와 시간을 먼저 선택해 주세요.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setResult("error");
      setErrorMsg("이름과 연락처는 필수입니다.");
      return;
    }
    setSubmitting(true);
    setResult("idle");
    setErrorMsg("");
    try {
      const res = await fetch("/api/public/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          category,
          message: message.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setResult("success");
      } else {
        setErrorMsg(json.error ?? "예약에 실패했습니다.");
        setResult("error");
      }
    } catch {
      setErrorMsg("네트워크 오류");
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (result === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-surface p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <h3 className="mt-4 font-serif text-xl font-bold text-primary">예약이 접수되었습니다</h3>
        <p className="mt-2 text-sm text-text-muted">
          {formatKoreanDate(selectedDate)} {selectedTime} 상담 · {name} 님
        </p>
        <p className="mt-4 text-sm text-text">확인 이메일 발송됨. 영업일 24시간 이내 회신드립니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-surface p-6">
      <h3 className="font-serif text-lg font-bold text-primary">상담 예약</h3>
      <p className="mt-2 text-sm text-text-muted">
        원하시는 날짜와 시간을 선택하세요. 유료 상담(33,000원~)은 수임 시 차감됩니다.
      </p>

      <div className="mt-5">
        <p className="text-xs font-bold text-text-strong">1. 날짜 선택 (14일 이내)</p>
        {loadingDays ? (
          <p className="mt-3 text-sm text-text-muted">불러오는 중…</p>
        ) : days.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">현재 이용 가능한 예약일이 없습니다.</p>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {days.map((day) => {
              const hasSlots = day.slots.some((s) => s.available);
              const selected = day.date === selectedDate;
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!hasSlots}
                  onClick={() => {
                    setSelectedDate(day.date);
                    setSelectedTime("");
                  }}
                  className={`flex flex-col items-center rounded-lg border px-2 py-2 text-xs font-bold transition ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : hasSlots
                        ? "border-gold/30 bg-surface text-text hover:bg-gold-soft/30"
                        : "border-line bg-surface-muted text-text-muted opacity-50"
                  }`}
                >
                  <span className="text-[10px]">{WEEKDAY_KO[day.weekday] ?? day.weekday}</span>
                  <span className="mt-1 text-sm">{formatKoreanDate(day.date)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedDate && currentDay && (
        <div className="mt-5">
          <p className="text-xs font-bold text-text-strong">2. 시간 선택</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {currentDay.slots.length === 0 ? (
              <span className="text-sm text-text-muted">해당 날짜에 이용 가능한 시간이 없습니다.</span>
            ) : (
              currentDay.slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    selectedTime === slot.time
                      ? "bg-primary text-white"
                      : slot.available
                        ? "border border-gold/30 bg-surface text-text hover:bg-gold-soft/30"
                        : "border border-line bg-surface-muted text-text-muted line-through opacity-60"
                  }`}
                >
                  {slot.time}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {selectedDate && selectedTime && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3 border-t border-line pt-5">
          <p className="text-xs font-bold text-text-strong">3. 연락처 입력</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-text-muted">이름 *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 h-10 w-full rounded-md border border-gold/30 bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-text-muted">연락처 *</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="010-0000-0000"
                className="mt-1 h-10 w-full rounded-md border border-gold/30 bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-text-muted">이메일 (선택)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-gold/30 bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-text-muted">상담 분야</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-gold/30 bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-text-muted">간단 메모 (선택)</span>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-md border border-gold/30 bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting
              ? "접수 중…"
              : `${formatKoreanDate(selectedDate)} ${selectedTime} 상담 예약`}
          </button>

          {result === "error" && (
            <p className="text-sm font-semibold text-rose-600">{errorMsg}</p>
          )}
        </form>
      )}

      <p className="mt-4 text-[11px] text-text-muted">
        유료 상담(33,000원~55,000원)은 수임 시 차감됩니다. 무료 검토는 채팅/이메일로 가능합니다.
      </p>
    </div>
  );
}
