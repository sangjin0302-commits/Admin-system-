import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";

export const metadata: Metadata = {
  title: "오시는 길 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소 위치, 연락처, 운영시간 안내."
};

export default function ContactPage() {
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Contact</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">오시는 길</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="ethos-quote mt-5 text-base text-gold-deep">상담은 사전 예약을 권장드립니다.</p>
          </Reveal>
        </div>
      </section>

      {/* 연락처 + 지도 */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-7 lg:grid-cols-[1fr_1.3fr]">
            {/* 연락처 — DARK card */}
            <Reveal>
              <div className="ethos-band-dark ethos-grain rounded-[24px] p-9 text-white shadow-floating">
                <p className="ethos-eyebrow text-gold-soft">Contact</p>
                <h2 className="ethos-display mt-3 text-2xl text-white">연락처</h2>

                <div className="mt-8 space-y-6">
                  <div>
                    <p className="font-serif text-xs uppercase tracking-wider text-gold-soft">전화</p>
                    <a href="tel:020000000" className="mt-1 block font-serif text-3xl font-bold text-white">
                      02-0000-0000
                    </a>
                  </div>
                  <div>
                    <p className="font-serif text-xs uppercase tracking-wider text-gold-soft">이메일</p>
                    <a href="mailto:contact@ethos.kr" className="mt-1 block text-base text-white hover:text-gold-soft">
                      contact@ethos.kr
                    </a>
                  </div>
                  <div>
                    <p className="font-serif text-xs uppercase tracking-wider text-gold-soft">카카오톡</p>
                    <a
                      href="http://pf.kakao.com/_xXxXxXx"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-bold text-[#3C1E1E]"
                    >
                      카카오 채널 상담
                    </a>
                  </div>
                  <div>
                    <p className="font-serif text-xs uppercase tracking-wider text-gold-soft">운영시간</p>
                    <p className="mt-1 text-base text-white">평일 09:00 - 18:00</p>
                    <p className="text-xs text-white/60">주말 / 공휴일 휴무 (사전 예약 시 가능)</p>
                  </div>
                </div>

                <Link
                  href="/intake"
                  className="mt-10 inline-flex h-11 w-full items-center justify-center rounded-lg bg-gold text-sm font-bold text-primary transition hover:bg-gold-soft"
                >
                  온라인 상담 신청
                </Link>
              </div>
            </Reveal>

            {/* 주소 + 지도 */}
            <Reveal delay={1}>
              <div className="ethos-card p-9">
                <p className="ethos-eyebrow">Location</p>
                <h2 className="ethos-display mt-3 text-2xl">사무소 위치</h2>
                <div className="mt-7 space-y-2">
                  <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">주소</p>
                  <p className="text-base text-text-strong">서울특별시 (주소 등록 예정)</p>
                  <p className="text-sm text-text-muted">지하철 / 버스 정보 (등록 예정)</p>
                </div>

                <div className="mt-7 flex aspect-video items-center justify-center rounded-xl border-2 border-dashed border-gold/40 bg-surface-muted/40">
                  <div className="text-center">
                    <p className="font-serif text-sm font-bold text-text-muted">카카오맵 / 네이버 지도</p>
                    <p className="mt-1 text-xs text-text-muted">사무소 등록 후 표시됩니다</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <a
                    href="https://map.kakao.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-gold/40 bg-surface text-xs font-bold text-primary transition hover:bg-gold-soft/30"
                  >
                    카카오맵 보기
                  </a>
                  <a
                    href="https://map.naver.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-gold/40 bg-surface text-xs font-bold text-primary transition hover:bg-gold-soft/30"
                  >
                    네이버 지도
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
