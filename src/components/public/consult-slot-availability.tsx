"use client";

import Link from "next/link";

export function ConsultSlotAvailability() {
  return (
    <div className="ethos-card flex flex-col items-start gap-4 rounded-[20px] border border-gold/30 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-gold-deep" />
        </span>
        <div>
          <p className="font-serif text-sm font-bold text-primary">
            이번 주 무료 검토 접수 가능
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            평균 회신 영업일 24시간 내
          </p>
        </div>
      </div>

      <Link
        href="/intake"
        data-funnel="slot_availability_intake"
        className="ethos-cta-shine inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-serif text-sm font-bold text-white transition hover:bg-text-strong"
      >
        무료 검토 신청 <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
