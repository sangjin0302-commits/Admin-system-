"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CHANNELS } from "@/lib/constants/channels";

const FALLBACK = { phone: "02-0000-0000", email: "a.attorneyjean@gmail.com", hours: "평일 09:00 - 18:00" };

export function PublicFooter() {
  const [contact, setContact] = useState(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/site-contact")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.ok) {
          setContact({ phone: d.phone ?? FALLBACK.phone, email: d.email ?? FALLBACK.email, hours: d.hours ?? FALLBACK.hours });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const phone = contact.phone;
  const phoneTel = phone.replace(/[^0-9]/g, "");
  const email = contact.email;
  const hours = contact.hours;
  return (
    <footer className="mt-24 border-t border-gold/30 bg-primary text-white/90">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {/* 브랜드 */}
          <div>
            <p className="font-serif text-2xl font-bold tracking-[0.25em] text-white">ETHOS</p>
            <p className="mt-1 font-serif text-xs tracking-wide text-white/70">
              Administrative Attorney Office
            </p>
            <p className="mt-4 font-serif text-xs italic text-gold-soft">
              Reason in Process · Empathy for People · Trust in Every Step
            </p>
            <p className="mt-6 font-serif text-sm italic leading-7 text-gold-soft">
              절차에는 이성을, 사람에게는 공감을,<br />일에는 신뢰를.
            </p>
          </div>

          {/* 업무 분야 */}
          <div>
            <p className="font-serif text-sm font-bold uppercase tracking-wider text-gold-soft">
              업무 분야
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><Link href="/services/immigration" className="transition-colors duration-200 hover:text-gold-soft">비자/체류</Link></li>
              <li><Link href="/services/appeal" className="transition-colors duration-200 hover:text-gold-soft">행정심판</Link></li>
              <li><Link href="/services/contract" className="transition-colors duration-200 hover:text-gold-soft">계약서/사실조사</Link></li>
              <li><Link href="/services/license" className="transition-colors duration-200 hover:text-gold-soft">인허가</Link></li>
              <li><Link href="/services/corporate" className="transition-colors duration-200 hover:text-gold-soft">법인 설립</Link></li>
              <li><Link href="/portal" className="transition-colors duration-200 hover:text-gold-soft">의뢰인 포털</Link></li>
            </ul>
          </div>

          {/* 사무소 */}
          <div>
            <p className="font-serif text-sm font-bold uppercase tracking-wider text-gold-soft">
              사무소
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><Link href="/about" className="transition-colors duration-200 hover:text-gold-soft">대표 소개</Link></li>
              <li><Link href="/cases" className="transition-colors duration-200 hover:text-gold-soft">강연 · 활동</Link></li>
              <li><Link href="/blog" className="transition-colors duration-200 hover:text-gold-soft">법률 칼럼</Link></li>
              <li><Link href="/keyword" className="transition-colors duration-200 hover:text-gold-soft">키워드 가이드</Link></li>
              <li><Link href="/portal" className="transition-colors duration-200 hover:text-gold-soft">포털 · 진행조회</Link></li>
            </ul>
          </div>

          {/* 연락 */}
          <div>
            <p className="font-serif text-sm font-bold uppercase tracking-wider text-gold-soft">
              상담 안내
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li>
                <p className="text-xs text-white/60">전화</p>
                <a href={`tel:${phoneTel}`} className="font-serif text-base font-bold text-white" aria-label={`전화 상담 ${phone}`}>
                  {phone}
                </a>
              </li>
              <li>
                <p className="text-xs text-white/60">이메일</p>
                <a href={`mailto:${email}`} className="text-sm text-white">
                  {email}
                </a>
              </li>
              <li>
                <p className="text-xs text-white/60">운영시간</p>
                <p className="text-sm">{hours}</p>
              </li>
            </ul>
          </div>
        </div>

        {/* 5채널 connect strip */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6">
          <p className="font-serif text-xs font-bold uppercase tracking-[0.3em] text-gold-soft">Connect</p>
          <div className="flex flex-wrap gap-2">
            <a href={CHANNELS.naverTalk.url} target="_blank" rel="noreferrer"
               className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#03C75A] px-3 text-xs font-bold text-white transition hover:brightness-95">
              N · 톡톡
            </a>
            <a href={CHANNELS.kakao.url} target="_blank" rel="noreferrer"
               className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#FEE500] px-3 text-xs font-bold text-[#3C1E1E] transition hover:brightness-95">
              카카오
            </a>
            <a href={CHANNELS.telegram.url} target="_blank" rel="noreferrer"
               className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0088CC] px-3 text-xs font-bold text-white transition hover:brightness-95">
              Telegram
            </a>
            <a href={CHANNELS.email.url}
               className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold/40 bg-white/5 px-3 text-xs font-bold text-white transition hover:bg-white/10">
              Email
            </a>
            <a href={CHANNELS.naverExpert.url} target="_blank" rel="noreferrer"
               className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold/40 bg-white/5 px-3 text-xs font-bold text-gold-soft transition hover:bg-white/10">
              ★ 엑스퍼트
            </a>
            <Link href="/links"
               className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gold/40 bg-white/5 px-3 text-xs font-bold text-white/80 transition hover:bg-white/10">
              모든 채널 →
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <p>© 2026 ETHOS 행정사사무소. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors duration-200 hover:text-gold-soft">개인정보 처리방침</Link>
            <Link href="/terms" className="transition-colors duration-200 hover:text-gold-soft">이용약관</Link>
            <Link href="/sitemap.xml" className="transition-colors duration-200 hover:text-gold-soft">Sitemap</Link>
            <Link href="/feed.xml" className="transition-colors duration-200 hover:text-gold-soft">RSS</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
