import type { Metadata } from "next";

import { BookingWidget } from "@/components/public/booking-widget";

// 정적 셸 + 예약 위젯(searchParams 미사용) → ISR. 함수호출 절감.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "상담 예약 — 에토스 행정사사무소(ETHOS)",
  description:
    "ETHOS 행정사사무소 상담 예약. 원하시는 날짜와 시간을 선택하시면 영업일 24시간 이내 회신드립니다.",
  alternates: { canonical: "/book-consultation" },
};

export default function BookConsultationPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <p className="ethos-eyebrow">CONSULTATION</p>
        <h1 className="ethos-display mt-3 text-3xl sm:text-4xl">상담 예약</h1>
        <p className="mt-4 text-sm text-text-muted sm:text-base">
          원하시는 날짜와 시간을 선택하고 연락처를 남겨 주세요. 영업일 24시간 이내 회신드립니다.
        </p>
      </div>

      <div className="mt-10">
        <BookingWidget />
      </div>
    </main>
  );
}
