import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { NewsletterSubscribeForm } from "@/components/public/newsletter-subscribe-form";

// 정적 페이지 — 공개 기본 로케일(국문) 고정.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "뉴스레터 구독 — 에토스 행정사사무소(ETHOS)",
  description: "비자·행정심판·인허가 실무 인사이트를 새 칼럼이 올라올 때마다 이메일로 받아보세요.",
  alternates: { canonical: "/newsletter" }
};

export default function NewsletterPage() {
  return (
    <div className="overflow-x-clip">
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Newsletter</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">뉴스레터 구독</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-text-muted">
              비자·행정심판·계약서·인허가 실무 인사이트를 새 칼럼이 올라올 때마다 이메일로 보내드립니다.
              <br />
              구독은 언제든 해지할 수 있습니다.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="rounded-3xl border border-line bg-surface-muted/50 px-6 py-12 sm:px-12">
              <NewsletterSubscribeForm lang="ko" />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
