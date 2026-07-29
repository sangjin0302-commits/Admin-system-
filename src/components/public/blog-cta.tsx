import Link from "next/link";

import { CHANNELS, CONSULT_TAGLINE } from "@/lib/constants/channels";
import { PUBLIC_CATEGORY_LABEL, CATEGORY_CHANNEL, toPublicCategory } from "@/lib/services/blog-categorizer";

const CHANNEL_META = {
  naverTalk: { label: "네이버 톡톡으로 검토 요청", labelEn: "Request review via Naver Talk", bg: "bg-[#03C75A]", fg: "text-white", url: CHANNELS.naverTalk.url },
  kakao: { label: "카카오로 검토 요청", labelEn: "Request review via KakaoTalk", bg: "bg-[#FEE500]", fg: "text-[#3C1E1E]", url: CHANNELS.kakao.url },
  telegram: { label: "Telegram", labelEn: "Telegram", bg: "bg-[#0088CC]", fg: "text-white", url: CHANNELS.telegram.url },
  email: { label: "이메일로 검토 요청", labelEn: "Request review by email", bg: "bg-primary", fg: "text-white", url: CHANNELS.email.url }
} as const;

export function BlogCta({ category, lang = "ko" }: { category: string; lang?: "ko" | "en" }) {
  const cat = toPublicCategory(category);
  const recommended = CATEGORY_CHANNEL[cat];
  const ch = CHANNEL_META[recommended];
  const label = PUBLIC_CATEGORY_LABEL[cat];
  const en = lang === "en";
  const intakeHref = `/intake?cat=${cat}&from=blog${en ? "&lang=en" : ""}`;

  return (
    <div className="ethos-grain relative mt-12 overflow-hidden rounded-[24px] border border-gold/30 ethos-dark-card p-7 text-center text-white shadow-floating sm:p-9">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-soft">
        {en ? `${label} — case review` : `${label} 사안 검토`}
      </p>
      <h2 className="ethos-display mt-3 text-2xl text-white">
        {en ? "Have a similar case?" : "비슷한 사안이 있으신가요?"}
      </h2>
      <p className="mt-3 text-sm leading-7 text-white/80">
        {en ? (
          "A free initial review first — we tell you the likely cost and whether we can take it on."
        ) : (
          <>
            {CONSULT_TAGLINE}
            <br />
            검토 후 예상 비용과 진행 가능 여부를 먼저 안내드립니다.
          </>
        )}
      </p>

      <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={ch.url}
          target="_blank"
          rel="noreferrer"
          data-funnel="blog_cta_primary"
          data-funnel-cat={cat}
          className={`ethos-cta-shine inline-flex h-11 items-center rounded-lg ${ch.bg} px-6 text-sm font-bold ${ch.fg} transition hover:brightness-95`}
        >
          {en ? `${ch.labelEn} →` : `${ch.label} →`}
        </a>
        <Link
          href={intakeHref}
          data-funnel="blog_cta_intake"
          data-funnel-cat={cat}
          className="inline-flex h-11 items-center rounded-lg border border-gold/60 px-6 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
        >
          {en ? "Consultation form" : "상담 신청서"}
        </Link>
        <Link
          href="/consult"
          data-funnel="blog_cta_consult"
          className="inline-flex h-11 items-center rounded-lg border border-gold/40 px-6 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          {en ? "How it works" : "상담 안내"}
        </Link>
      </div>
    </div>
  );
}
