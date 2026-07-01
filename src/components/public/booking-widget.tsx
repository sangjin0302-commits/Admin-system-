"use client";

import { useState } from "react";

const SLOTS = [
  { day: "월-금", times: ["10:00", "11:00", "14:00", "15:00", "16:00"] },
];

const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK;

export function BookingWidget() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  if (CAL_LINK) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-surface p-6">
        <h3 className="font-serif text-lg font-bold text-primary">상담 예약</h3>
        <p className="mt-2 text-sm text-text-muted">
          원하시는 날짜와 시간을 선택하세요. 유료 상담(33,000원~)은 수임 시 차감됩니다.
        </p>
        <iframe
          src={CAL_LINK}
          className="mt-4 h-[500px] w-full rounded-xl border-0"
          title="상담 예약"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-surface p-6">
      <h3 className="font-serif text-lg font-bold text-primary">상담 예약</h3>
      <p className="mt-2 text-sm text-text-muted">
        원하시는 날짜와 시간을 선택하면 접수 폼에 자동 연결됩니다.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-text-strong">날짜 선택</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="mt-1 block w-full rounded-lg border border-gold/30 bg-surface px-3 py-2 text-sm"
          />
        </div>

        {selectedDate && (
          <div>
            <label className="text-xs font-bold text-text-strong">시간 선택 (평일)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SLOTS[0].times.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    selectedTime === time
                      ? "bg-primary text-white"
                      : "border border-gold/30 bg-surface text-text hover:bg-gold-soft/30"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedDate && selectedTime && (
          <a
            href={`/intake?from=booking&consultation_date=${selectedDate}&consultation_time=${selectedTime}`}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            {selectedDate} {selectedTime} 상담 접수하기
          </a>
        )}
      </div>

      <p className="mt-4 text-[11px] text-text-muted">
        유료 상담(33,000원~55,000원)은 수임 시 차감됩니다. 무료 검토는 채팅/이메일로 가능합니다.
      </p>
    </div>
  );
}
