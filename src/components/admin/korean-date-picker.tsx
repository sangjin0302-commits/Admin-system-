"use client";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale";
import { format } from "date-fns";
import "react-day-picker/style.css";

interface Props {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  label?: string;
}

export function KoreanDatePicker({ selected, onSelect, label }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {label && <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {selected ? format(selected, "yyyy년 M월 d일 (EEEE)", { locale: ko }) : "날짜 선택..."}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border bg-white p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => { onSelect(date); setOpen(false); }}
            locale={ko}
          />
        </div>
      )}
    </div>
  );
}
