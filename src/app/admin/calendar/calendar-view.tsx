"use client";

import { useMemo, useState } from "react";

type SerializedEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  caseId?: string;
  reminderMinutes?: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ initialEvents }: { initialEvents: SerializedEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, SerializedEvent[]>();
    for (const e of initialEvents) {
      const d = new Date(e.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [initialEvents]);

  const monthStart = cursor;
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const startWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const cells: { date: Date | null; key: string }[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: null, key: `pad-start-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
    cells.push({ date, key: `d-${d}` });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `pad-end-${cells.length}` });
  }

  function dayKey(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function prevMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  }

  const selectedEvents = selectedDate ? eventsByDay.get(selectedDate) ?? [] : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
        >
          ← Prev
        </button>
        <div className="text-sm font-semibold">
          {cursor.toLocaleString(undefined, { year: "numeric", month: "long" })}
        </div>
        <button
          onClick={nextMonth}
          className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px border bg-gray-200">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-gray-100 px-2 py-1 text-xs font-semibold text-center">
            {w}
          </div>
        ))}
        {cells.map((c) => {
          if (!c.date) {
            return <div key={c.key} className="bg-gray-50 min-h-[80px]" />;
          }
          const key = dayKey(c.date);
          const evts = eventsByDay.get(key) ?? [];
          const isSelected = selectedDate === key;
          return (
            <button
              key={c.key}
              onClick={() => setSelectedDate(key)}
              className={`bg-white p-1 min-h-[80px] text-left text-xs hover:bg-blue-50 ${
                isSelected ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="font-semibold">{c.date.getDate()}</div>
              <div className="mt-1 space-y-0.5">
                {evts.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className="truncate rounded bg-blue-100 px-1 text-blue-800"
                  >
                    {e.title}
                  </div>
                ))}
                {evts.length > 2 && (
                  <div className="text-text-muted">+{evts.length - 2} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 rounded border p-3">
          <h3 className="mb-2 text-sm font-semibold">Events on {selectedDate}</h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-text-muted">No events.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((e) => (
                <li key={e.id} className="text-sm">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-text-muted">
                    {new Date(e.start).toLocaleTimeString()} –{" "}
                    {new Date(e.end).toLocaleTimeString()}
                  </div>
                  {e.description && <div className="text-xs">{e.description}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
