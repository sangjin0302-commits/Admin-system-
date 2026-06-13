import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "오시는 길 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소 위치, 연락처, 운영시간 안내."
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-16 sm:px-6 sm:py-20">
      <section className="text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Contact</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-primary sm:text-5xl">
          오시는 길
        </h1>
        <p className="mt-3 font-serif text-base italic text-text-muted">
          상담은 사전 예약을 권장드립니다.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* 연락처 */}
        <Card className="p-7">
          <h2 className="font-serif text-xl font-bold text-primary">연락처</h2>
          <div className="mt-6 space-y-5">
            <div>
              <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">전화</p>
              <a href="tel:020000000" className="mt-1 block font-serif text-2xl font-bold text-primary">
                02-0000-0000
              </a>
            </div>
            <div>
              <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">이메일</p>
              <a href="mailto:contact@ethos.kr" className="mt-1 block text-base text-text-strong hover:text-gold-deep">
                contact@ethos.kr
              </a>
            </div>
            <div>
              <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">카카오톡</p>
              <a
                href="http://pf.kakao.com/_xXxXxXx"
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-2 rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-bold text-[#3C1E1E]"
              >
                카카오 채널 상담
              </a>
            </div>
            <div>
              <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">운영시간</p>
              <p className="mt-1 text-sm text-text">평일 09:00 - 18:00</p>
              <p className="text-xs text-text-muted">주말 / 공휴일 휴무 (사전 예약 시 가능)</p>
            </div>
          </div>

          <Link
            href="/intake"
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-white transition hover:bg-text-strong"
          >
            온라인 상담 신청
          </Link>
        </Card>

        {/* 주소 + 지도 placeholder */}
        <Card className="p-7">
          <h2 className="font-serif text-xl font-bold text-primary">사무소 위치</h2>
          <div className="mt-6 space-y-2">
            <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">주소</p>
            <p className="text-base text-text-strong">서울특별시 (주소 등록 예정)</p>
            <p className="text-sm text-text-muted">지하철 / 버스 정보 (등록 예정)</p>
          </div>

          {/* 카카오맵 placeholder */}
          <div className="mt-6 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-gold/40 bg-surface-muted/40">
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
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gold/40 bg-surface text-xs font-bold text-primary transition hover:bg-gold-soft/30"
            >
              카카오맵 보기
            </a>
            <a
              href="https://map.naver.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-gold/40 bg-surface text-xs font-bold text-primary transition hover:bg-gold-soft/30"
            >
              네이버 지도
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
