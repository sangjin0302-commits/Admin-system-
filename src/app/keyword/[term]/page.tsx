import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/prisma/client";
import { Reveal } from "@/components/public/reveal";
import { CHANNELS, CONSULT_TAGLINE } from "@/lib/constants/channels";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { NAVER_BLOG_SOURCE } from "@/lib/services/naver-rss-importer";
import { PUBLIC_CATEGORY_LABEL, toPublicCategory } from "@/lib/services/blog-categorizer";
import { getKeywordLanding } from "@/lib/services/keyword-landing-service";

export const dynamic = "force-dynamic";

type ResolvedKeyword = { label: string; query: string[]; description: string; deadlineNote?: string };

// 하드코딩 7종 우선, 없으면 DB 확장 랜딩. 렌더 형태는 동일하게 정규화.
async function resolveKeyword(decoded: string): Promise<ResolvedKeyword | null> {
  const k = KEYWORDS[decoded];
  if (k) return { ...k, deadlineNote: DEADLINE_NOTE[decoded] };
  const db = await getKeywordLanding(decoded).catch(() => null);
  if (db) return { label: db.label, query: db.tokens, description: db.description, deadlineNote: db.deadlineNote };
  return null;
}

// 기한이 중요한 키워드 → 신뢰·긴급성 마이크로카피 (사실 기반, 과장 금지)
const DEADLINE_NOTE: Record<string, string> = {
  "행정심판": "행정심판 청구는 처분을 안 날부터 90일 이내입니다. 기한을 놓치면 청구 자체가 각하될 수 있어 빠른 검토가 중요합니다.",
  "강제퇴거": "강제퇴거·출국명령에 대한 이의신청·행정심판은 기한이 짧습니다. 처분서를 받으셨다면 즉시 검토를 권해드립니다.",
  "d-10-비자": "D-10 체류 기간 만료 전 전환·연장 준비가 필요합니다. 만료가 임박했다면 서둘러 검토받으세요.",
  "f-2-7-비자": "점수·체류 요건은 심사 시점 기준으로 계산됩니다. 신청 시기에 따라 결과가 달라질 수 있어 미리 점검하는 것이 좋습니다."
};

// 허용 키워드 (행정사 핵심 검색어)
const KEYWORDS: Record<string, { label: string; query: string[]; description: string }> = {
  "d-8-비자": {
    label: "D-8 비자 (기업투자)",
    query: ["D-8", "D8", "기업투자", "투자비자"],
    description: "외국인 창업가 D-8 비자 신청, 요건, 사업계획서, 자본금 안내 — 행정사 지상진이 정리한 실무 가이드."
  },
  "d-10-비자": {
    label: "D-10 비자 (구직)",
    query: ["D-10", "D10", "구직비자", "기술창업"],
    description: "D-10 구직비자에서 D-8 전환, 점수제 가산점, 활동 범위 — Jean의 실무 안내."
  },
  "f-2-7-비자": {
    label: "F-2-7 비자 (점수제 거주)",
    query: ["F-2-7", "F27", "점수제", "거주비자"],
    description: "F-2-7 점수제 거주 비자 신청 점수 계산, 필요 서류, 갱신 안내."
  },
  "행정심판": {
    label: "행정심판",
    query: ["행정심판", "재결", "청구기한"],
    description: "행정심판 청구 90일 기한, 처분 취소, 재결 절차 — 행정사 지상진의 실무 안내."
  },
  "귀화": {
    label: "귀화 · 국적",
    query: ["귀화", "국적", "외국국적불행사"],
    description: "일반/간이/특별 귀화, 외국국적불행사 서약 안내 — 다국어 응대 가능."
  },
  "법인설립": {
    label: "법인 설립",
    query: ["법인설립", "주식회사", "정관"],
    description: "외국인 1인 창업 법인 vs 개인사업자, 정관 작성, 등기 준비 — Jean의 실무 가이드."
  },
  "강제퇴거": {
    label: "강제퇴거 대응",
    query: ["강제퇴거", "출국명령", "이의신청"],
    description: "강제퇴거 명령, 출국명령 이의신청, 행정심판 대응 절차."
  }
};

export async function generateMetadata({ params }: { params: Promise<{ term: string }> }): Promise<Metadata> {
  const { term } = await params;
  const decoded = decodeURIComponent(term);
  const k = await resolveKeyword(decoded);
  if (!k) return { title: "키워드 — ETHOS" };
  return {
    title: `${k.label} — 에토스 행정사사무소(ETHOS)`,
    description: k.description,
    alternates: { canonical: `/keyword/${encodeURIComponent(decoded)}` }
  };
}

export default async function KeywordLandingPage({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params;
  const decoded = decodeURIComponent(term);
  const k = await resolveKeyword(decoded);
  if (!k) notFound();

  // 키워드 매칭 블로그
  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
      source: NAVER_BLOG_SOURCE,
      OR: k.query.flatMap((q) => [
        { title: { contains: q } },
        { excerpt: { contains: q } }
      ])
    },
    orderBy: { publishedAt: "desc" },
    take: 12,
    select: { slug: true, title: true, excerpt: true, category: true, publishedAt: true }
  }).catch(() => [] as Array<{ slug: string; title: string; excerpt: string | null; category: string; publishedAt: Date | null }>);

  const deadlineNote = k.deadlineNote;
  const topPosts = posts.slice(0, 3);
  const morePosts = posts.slice(3);

  return (
    <div className="overflow-x-clip">
      <BreadcrumbJsonLd
        items={[
          { name: "홈", url: "/" },
          { name: "키워드", url: "/keyword" },
          { name: k.label, url: `/keyword/${term}` }
        ]}
      />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Keyword Guide</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3rem]">{k.label}</h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-text">{k.description}</p>
          </Reveal>
          <Reveal delay={3}>
            <p className="mt-5 text-xs text-text-muted">{CONSULT_TAGLINE}</p>
          </Reveal>
        </div>
      </section>

      {/* CTA 위계 — 무료 검토(주) + AI 진단(보조) */}
      <section className="pb-4 sm:pb-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-card rounded-[24px] border border-gold/30 p-6 text-center shadow-floating sm:p-8">
              <p className="ethos-eyebrow">지금 시작하기</p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-text-muted">
                {k.label} 사안, 어디서부터 손대야 할지 막막하신가요? 무료 검토로 다음 단계를 먼저 확인하세요.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`/intake?from=keyword&cat=${encodeURIComponent(decoded)}`}
                  data-funnel="keyword_cta_primary"
                  data-funnel-cat={decoded}
                  className="ethos-cta-shine inline-flex h-12 w-full items-center justify-center rounded-lg bg-gold px-7 text-sm font-bold text-primary shadow-floating transition hover:brightness-105 sm:w-auto"
                >
                  이 사안 무료 검토 신청 →
                </Link>
                <Link
                  href="/quick-check"
                  data-funnel="keyword_cta_quickcheck"
                  data-funnel-cat={decoded}
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-gold/50 bg-gold-soft/20 px-7 text-sm font-bold text-primary transition hover:bg-gold-soft/40 sm:w-auto"
                >
                  30초 AI 진단
                </Link>
              </div>
              <p className="mt-4 text-xs text-text-muted">{CONSULT_TAGLINE} · 검토 회신 24시간 이내</p>
              {deadlineNote && (
                <p className="mx-auto mt-5 max-w-xl rounded-xl border border-gold/30 bg-gold-soft/15 px-4 py-3 text-xs leading-6 text-gold-deep">
                  ⏱ {deadlineNote}
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 무료 체크리스트 리드마그넷 */}
      <section className="py-6 sm:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal delay={1}>
            <Link
              href="/quick-check"
              data-funnel="keyword_lead_magnet"
              data-funnel-cat={decoded}
              className="ethos-card ethos-card-hover group flex flex-col items-start gap-4 rounded-[20px] border border-gold/30 bg-gold-soft/15 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/20 text-gold-deep">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <div>
                  <p className="font-serif text-sm font-bold text-primary">무료 체크리스트</p>
                  <p className="mt-1 text-sm leading-6 text-text-muted">
                    {k.label} 준비 체크리스트를 받아보세요 — 필요한 서류·요건을 미리 점검할 수 있습니다.
                  </p>
                </div>
              </div>
              <span className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-lg border border-gold/50 bg-surface px-5 text-sm font-bold text-primary transition group-hover:bg-gold-soft/40">
                체크리스트 받기 →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 관련 블로그 */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="ethos-display text-2xl sm:text-3xl">가장 도움이 되는 글</h2>
            <p className="mt-2 text-sm text-text-muted">
              네이버 블로그에서 행정사 지상진이 정리한 {k.label} 관련 글입니다.
            </p>
          </Reveal>

          {posts.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-gold/30 bg-gold-soft/15 p-6 text-sm text-text-muted">
              아직 이 키워드 관련 칼럼이 import되지 않았습니다. /blog 전체 글에서 검색해보세요.
            </p>
          ) : (
            <>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {topPosts.map((p, i) => (
                  <Reveal key={p.slug} delay={((i % 3) + 1) as 1 | 2 | 3}>
                    <Link
                      href={`/blog/${p.slug}`}
                      data-funnel="keyword_to_blog"
                      data-funnel-cat={decoded}
                      className="ethos-card ethos-blog-card group block h-full p-6"
                    >
                      <span className="inline-block rounded-full bg-gold-soft/50 px-2.5 py-0.5 font-serif text-[11px] font-bold text-gold-deep">
                        {PUBLIC_CATEGORY_LABEL[toPublicCategory(p.category)]}
                      </span>
                      <h3 className="ethos-display ethos-blog-title mt-4 text-base leading-snug line-clamp-2">
                        {p.title}
                      </h3>
                      {p.excerpt && (
                        <p className="mt-2 line-clamp-3 text-xs leading-6 text-text-muted">{p.excerpt}</p>
                      )}
                      <p className="mt-3 text-[11px] text-text-muted">
                        {p.publishedAt?.toLocaleDateString("ko-KR")}
                      </p>
                    </Link>
                  </Reveal>
                ))}
              </div>

              {morePosts.length > 0 && (
                <div className="mt-12">
                  <Reveal>
                    <h3 className="ethos-display text-lg sm:text-xl">참고 자료</h3>
                  </Reveal>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {morePosts.map((p, i) => (
                      <Reveal key={p.slug} delay={((i % 2) + 1) as 1 | 2}>
                        <Link
                          href={`/blog/${p.slug}`}
                          data-funnel="keyword_to_blog"
                          data-funnel-cat={decoded}
                          className="ethos-card group flex items-center justify-between gap-3 rounded-xl p-4 transition hover:border-gold/40"
                        >
                          <span className="line-clamp-1 font-serif text-sm font-semibold text-primary">
                            {p.title}
                          </span>
                          <span className="shrink-0 text-xs text-text-muted">
                            {PUBLIC_CATEGORY_LABEL[toPublicCategory(p.category)]}
                          </span>
                        </Link>
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="ethos-grain relative overflow-hidden rounded-[24px] border border-gold/30 ethos-dark-card p-8 text-center text-white shadow-floating sm:p-12">
            <p className="font-serif text-[11px] font-bold uppercase tracking-[0.3em] text-gold-soft">
              {k.label} 사안 검토
            </p>
            <h2 className="ethos-display mt-3 text-2xl text-white sm:text-3xl">
              {k.label} 관련 검토가 필요하신가요?
            </h2>
            <p className="mt-3 text-sm leading-7 text-white">
              무료 검토 회신 24시간 이내. 본격 상담은 33,000~55,000원, 수임 시 차감.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <a href={CHANNELS.naverTalk.url} target="_blank" rel="noreferrer" data-funnel="keyword_cta_naver" data-funnel-cat={decoded}
                 className="inline-flex h-11 items-center rounded-lg bg-[#03C75A] px-5 text-sm font-bold text-white">
                네이버 톡톡
              </a>
              <a href={CHANNELS.kakao.url} target="_blank" rel="noreferrer" data-funnel="keyword_cta_kakao" data-funnel-cat={decoded}
                 className="inline-flex h-11 items-center rounded-lg bg-[#FEE500] px-5 text-sm font-bold text-[#3C1E1E]">
                카카오
              </a>
              <Link href={`/intake?from=keyword&cat=${encodeURIComponent(decoded)}`} data-funnel="keyword_cta_intake" data-funnel-cat={decoded}
                 className="inline-flex h-11 items-center rounded-lg bg-gold px-5 text-sm font-bold text-primary">
                상담 신청서 →
              </Link>
              <Link href="/links" className="inline-flex h-11 items-center rounded-lg border border-gold/50 px-5 text-sm font-semibold text-gold-soft">
                모든 채널
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
