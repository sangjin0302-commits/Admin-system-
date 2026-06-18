"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const FALLBACK = { phone: "02-0000-0000", email: "contact@ethos.kr", hours: "평일 09:00 - 18:00" };

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
            <p className="mt-6 text-xs leading-6 text-white/60">
              에토스 행정사사무소는 비자, 행정심판, 계약서·사실조사, 인허가 업무를
              로고스·파토스·에토스 철학으로 함께합니다.
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
            </ul>
          </div>

          {/* 사무소 */}
          <div>
            <p className="font-serif text-sm font-bold uppercase tracking-wider text-gold-soft">
              사무소
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li><Link href="/about" className="transition-colors duration-200 hover:text-gold-soft">대표 소개</Link></li>
              <li><Link href="/cases" className="transition-colors duration-200 hover:text-gold-soft">처리 사례</Link></li>
              <li><Link href="/blog" className="transition-colors duration-200 hover:text-gold-soft">법률 칼럼</Link></li>
              <li><Link href="/track" className="transition-colors duration-200 hover:text-gold-soft">진행상황 조회</Link></li>
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
                <a href={`tel:${phoneTel}`} className="font-serif text-base font-bold text-white">
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

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <p>© 2026 ETHOS 행정사사무소. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors duration-200 hover:text-gold-soft">개인정보 처리방침</Link>
            <Link href="/terms" className="transition-colors duration-200 hover:text-gold-soft">이용약관</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
