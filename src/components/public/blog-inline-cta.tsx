"use client";

import Link from "next/link";
import { PUBLIC_CATEGORY_LABEL, toPublicCategory } from "@/lib/services/blog-categorizer";

const CATEGORY_HOOK: Record<string, string> = {
  visa: "비자·체류 문제, 혼자 고민하지 마세요.",
  appeal: "행정심판, 기한이 중요합니다.",
  contract: "계약·사실조사, 전문가의 눈이 필요합니다.",
  license: "인허가 절차, 한 번에 바르게.",
  corporate: "법인설립, 정확한 준비가 핵심입니다.",
  other: "행정 절차, 전문가에게 맡기세요.",
};

const CATEGORY_HOOK_EN: Record<string, string> = {
  visa: "Visa & residency issues — you don't have to figure them out alone.",
  appeal: "Administrative appeals — deadlines matter.",
  contract: "Contracts & fact-finding need an expert eye.",
  license: "Permits & licenses — get it right the first time.",
  corporate: "Company formation hinges on accurate preparation.",
  other: "Leave the administrative procedure to a specialist.",
};

export function BlogInlineCta({ category, lang = "ko" }: { category: string; lang?: "ko" | "en" }) {
  const cat = toPublicCategory(category);
  const en = lang === "en";
  const label = PUBLIC_CATEGORY_LABEL[cat];
  const hook = en
    ? (CATEGORY_HOOK_EN[cat] ?? CATEGORY_HOOK_EN.other)
    : (CATEGORY_HOOK[cat] ?? CATEGORY_HOOK.other);
  const rawPhone = process.env.NEXT_PUBLIC_OFFICE_PHONE?.trim();
  // 사무실 전화번호가 없거나 placeholder(0000-0000)면 죽은 tel: 링크를 걸지 않고 버튼 자체를 숨긴다.
  const phone = rawPhone && !rawPhone.includes("0000-0000") ? rawPhone : null;
  const telHref = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : null;
  const intakeHref = `/intake?cat=${cat}&from=blog_inline${en ? "&lang=en" : ""}`;

  return (
    <aside
      className="my-10 rounded-xl border-l-4 border-gold bg-gold-soft/20 px-5 py-6 sm:px-7 sm:py-7"
      data-funnel="blog_inline_cta"
      data-funnel-cat={cat}
    >
      {/* eyebrow */}
      <p className="ethos-eyebrow text-[10px] tracking-[0.25em] text-gold-deep">
        {en ? `${label} — specialist consultation` : `${label} 전문 상담`}
      </p>

      {/* headline */}
      <p className="mt-2 font-serif text-lg font-bold leading-snug text-primary sm:text-xl">
        {hook}
      </p>

      {/* trust badge */}
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-white/60 px-3 py-1 text-xs font-semibold text-gold-deep">
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5 shrink-0"
          aria-hidden="true"
        >
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm.75 8a.75.75 0 0 1-1.5 0V4a.75.75 0 0 1 1.5 0v4Zm-.75 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
          <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM7.25 4a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0V4ZM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
        </svg>
        {en ? "Reply within 4 business hours" : "영업시간 내 4시간 안에 답변"}
      </span>

      {/* CTA buttons */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={intakeHref}
          data-funnel="blog_inline_cta_primary"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-95 active:scale-[0.98]"
        >
          {en ? "Request a free review →" : "무료 검토 요청 →"}
        </Link>
        {phone && telHref && (
          <a
            href={telHref}
            data-funnel="blog_inline_cta_phone"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gold/50 bg-white/50 px-6 text-sm font-semibold text-primary transition hover:bg-gold-soft/30 active:scale-[0.98]"
          >
            {en ? `Call · ${phone}` : `전화 상담 · ${phone}`}
          </a>
        )}
      </div>
    </aside>
  );
}
