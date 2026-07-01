"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Reveal } from "@/components/public/reveal";
import {
  TESTIMONIAL_CATEGORY_LABELS as CATEGORY_BADGE,
  type PublicTestimonial
} from "@/lib/services/testimonials-shared";

// 필터 칩 순서 (실제 존재하는 카테고리만 렌더)
const FILTER_ORDER: Array<{ key: string; label: string }> = [
  { key: "VISA_STAY", label: "비자" },
  { key: "ADMIN_APPEAL", label: "행정심판" },
  { key: "LICENSE_PERMIT", label: "인허가" },
  { key: "CORP_FORMATION", label: "법인" },
  { key: "CONTRACT_INVESTIGATION", label: "계약" }
];

// 외부 리뷰 채널 (URL 미설정 시 표시하지 않음 — 가짜 평점 금지)
const REVIEW_BADGES: Array<{ label: string; url: string; brand: string }> = [
  { label: "네이버 후기 보기", url: "https://m.expert.naver.com/expert/profile/home?storeId=100060507", brand: "#03C75A" }
];

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`별점 ${full}점`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill={i < full ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export function Testimonials({ items }: { items: PublicTestimonial[] }) {
  const TESTIMONIALS = items;
  const [active, setActive] = useState<string | null>(null);

  const availableFilters = useMemo(
    () => FILTER_ORDER.filter((f) => TESTIMONIALS.some((t) => t.category === f.key)),
    [TESTIMONIALS]
  );

  const visible = useMemo(
    () => (active ? TESTIMONIALS.filter((t) => t.category === active) : TESTIMONIALS),
    [TESTIMONIALS, active]
  );

  if (TESTIMONIALS.length === 0) return null;

  // 필터는 카테고리가 2종 이상일 때만 노출
  const showFilters = availableFilters.length >= 2;

  return (
    <section className="ethos-band ethos-band-soft py-24 sm:py-28" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="ethos-eyebrow">Client Voices</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft/25 px-3.5 py-1">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-gold-deep" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M9 12l2 2 4-4" />
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
            <span className="font-serif text-[11px] font-bold text-gold-deep">검증된 후기</span>
          </div>
          <h2 id="testimonials-heading" className="ethos-display mt-4 text-3xl sm:text-[2.6rem]">
            의뢰인 후기
          </h2>
          <p className="mt-4 text-sm text-text-muted">
            개인정보 보호를 위해 익명·요약 처리된 후기입니다. 사안마다 결과는 다를 수 있습니다.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            다수의 검토·수임을 진행하며 쌓인 실제 의뢰인들의 목소리입니다.
          </p>
        </Reveal>

        {showFilters && (
          <Reveal>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-pressed={active === null}
                className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-bold transition ${
                  active === null
                    ? "border-gold bg-gold text-primary"
                    : "border-gold/40 bg-surface text-text-muted hover:bg-gold-soft/30"
                }`}
              >
                전체
              </button>
              {availableFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActive(f.key)}
                  aria-pressed={active === f.key}
                  className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-bold transition ${
                    active === f.key
                      ? "border-gold bg-gold text-primary"
                      : "border-gold/40 bg-surface text-text-muted hover:bg-gold-soft/30"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Reveal>
        )}

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {visible.map((t, i) => (
            <Reveal key={`${t.category}-${i}`} delay={((i % 2) + 1) as 1 | 2}>
              <figure className="ethos-card ethos-card-hover relative h-full overflow-hidden p-9">
                {/* 큰 따옴표 장식 */}
                <span
                  aria-hidden
                  className="ethos-quote pointer-events-none absolute -right-1 -top-2 select-none text-[7rem] leading-none text-gold/15"
                >
                  &ldquo;
                </span>

                <div className="relative flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-gold-soft/60 px-3 py-1 font-serif text-[11px] font-bold text-gold-deep">
                    {CATEGORY_BADGE[t.category] ?? t.category}
                  </span>
                  {t.outcome && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-surface px-3 py-1 font-serif text-[11px] font-bold text-primary">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {t.outcome}
                    </span>
                  )}
                  {t.timeline && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-3 py-1 font-serif text-[11px] font-semibold text-text-muted">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {t.timeline}
                    </span>
                  )}
                </div>

                {typeof t.rating === "number" && (
                  <div className="relative mt-4 text-gold">
                    <Stars rating={t.rating} />
                  </div>
                )}

                <blockquote className="relative mt-6">
                  <p className="ethos-quote text-base leading-8 text-text">&ldquo;{t.quote}&rdquo;</p>
                </blockquote>

                <figcaption className="relative mt-7 border-t border-gold/15 pt-5">
                  <p className="font-serif text-sm font-bold text-primary">{t.author}</p>
                  <p className="mt-1 text-xs text-text-muted">{t.context}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* 외부 리뷰 채널 */}
        <Reveal>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {REVIEW_BADGES.map((b) => (
              <a
                key={b.label}
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-gold/40 bg-surface px-5 text-sm font-bold text-primary transition hover:bg-gold-soft/30"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.brand }} aria-hidden />
                {b.label}
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-text-muted">저도 상담 받고 싶다면</p>
            <Link
              href="/intake"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gold/40 bg-gold-soft/30 px-7 text-sm font-bold text-primary transition hover:bg-gold-soft/60"
            >
              무료 검토 요청하기 →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
