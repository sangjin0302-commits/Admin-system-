"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CHANNELS, CONSULT_TAGLINE } from "@/lib/constants/channels";
import { PUBLIC_CATEGORY_LABEL, CATEGORY_CHANNEL, toPublicCategory } from "@/lib/services/blog-categorizer";
import { getABVariant, trackABEvent, type ABVariant } from "@/lib/utils/ab-test";

const CHANNEL_META = {
  naverTalk: { label: "네이버 톡톡으로 검토 요청", bg: "bg-[#03C75A]", fg: "text-white", url: CHANNELS.naverTalk.url },
  kakao: { label: "카카오로 검토 요청", bg: "bg-[#FEE500]", fg: "text-[#3C1E1E]", url: CHANNELS.kakao.url },
  telegram: { label: "Telegram", bg: "bg-[#0088CC]", fg: "text-white", url: CHANNELS.telegram.url },
  email: { label: "이메일로 검토 요청", bg: "bg-primary", fg: "text-white", url: CHANNELS.email.url },
} as const;

const VARIANTS = {
  control: {
    tagline: "비슷한 사안이 있으신가요? 검토 후 예상 비용을 먼저 안내드립니다.",
    primaryLabel: "무료 검토 요청",
  },
  variant_a: {
    tagline: "같은 유형 사안 다수 진행. 소요 기간은 사안별로 안내드립니다.",
    primaryLabel: "지금 무료 검토",
  },
  variant_b: {
    tagline: "검토 무료 · 24h 회신 · 수임 시 상담료 전액 차감",
    primaryLabel: "무료로 검토받기",
  },
};

export function BlogCtaAB({ category }: { category?: string }) {
  const [variant, setVariant] = useState<ABVariant>("control");

  useEffect(() => {
    const v = getABVariant("blog_cta_2024");
    setVariant(v);
    trackABEvent("blog_cta_2024", v, "impression");
  }, []);

  const config = VARIANTS[variant];
  const cat = toPublicCategory(category ?? "");
  const recommended = CATEGORY_CHANNEL[cat];
  const ch = CHANNEL_META[recommended];
  const label = PUBLIC_CATEGORY_LABEL[cat];

  return (
    <div className="ethos-grain relative mt-12 overflow-hidden rounded-[24px] border border-gold/30 ethos-dark-card p-7 text-center text-white shadow-floating sm:p-9">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-soft">
        {label} 사안 검토
      </p>
      <h2 className="ethos-display mt-3 text-2xl text-white">
        비슷한 사안이 있으신가요?
      </h2>
      <p className="mt-3 text-sm leading-7 text-white/80">
        {config.tagline}
      </p>

      <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={ch.url}
          target="_blank"
          rel="noreferrer"
          data-funnel="blog_cta_ab_primary"
          data-funnel-cat={cat}
          data-funnel-variant={variant}
          onClick={() => trackABEvent("blog_cta_2024", variant, "click")}
          className={`ethos-cta-shine inline-flex h-11 items-center rounded-lg ${ch.bg} px-6 text-sm font-bold ${ch.fg} transition hover:brightness-95`}
        >
          {config.primaryLabel} →
        </a>
        <Link
          href={`/intake?cat=${cat}&from=blog`}
          data-funnel="blog_cta_ab_intake"
          data-funnel-cat={cat}
          data-funnel-variant={variant}
          onClick={() => trackABEvent("blog_cta_2024", variant, "click_intake")}
          className="inline-flex h-11 items-center rounded-lg border border-gold/60 px-6 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
        >
          상담 신청서
        </Link>
        <Link
          href="/consult"
          data-funnel="blog_cta_ab_consult"
          data-funnel-variant={variant}
          onClick={() => trackABEvent("blog_cta_2024", variant, "click_consult")}
          className="inline-flex h-11 items-center rounded-lg border border-gold/40 px-6 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          상담 안내
        </Link>
      </div>
    </div>
  );
}
