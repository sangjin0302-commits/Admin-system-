import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";
import { fetchGazetteList, type GazetteItem } from "@/lib/services/gazette-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "관보 — 에토스 행정사사무소(ETHOS)",
  description: "외국인·행정 실무에 영향을 주는 최신 관보(법령·고시·공고)를 모아 봅니다.",
  alternates: {
    canonical: "/gazette",
    languages: { ko: "/gazette", en: "/gazette?lang=en", "x-default": "/gazette" },
  },
};

type Lang = "ko" | "en";

export default async function GazettePage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string; cat?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const lang: Lang = sp.lang === "en" ? "en" : "ko";
  const t = (ko: string, en: string) => (lang === "en" ? en : ko);

  const outcome = await fetchGazetteList(60);
  const items: GazetteItem[] = outcome.status === "ok" ? outcome.items : [];

  // 구분(category)별 필터 칩 — 응답에 실제로 존재하는 값만.
  const categories = Array.from(
    new Set(items.map((i) => i.category).filter((c) => c.length > 0))
  );
  const activeCat = sp.cat && categories.includes(sp.cat) ? sp.cat : null;
  const board = activeCat ? items.filter((i) => i.category === activeCat) : items;

  const fmtDate = (ms: number) =>
    ms > 0 ? new Date(ms).toLocaleDateString(lang === "en" ? "en-US" : "ko-KR") : "";

  return (
    <div className="overflow-x-clip">
      {/* 히어로 */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Official Gazette</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.6rem]">
              {t("관보", "Official Gazette")}
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-text-muted">
              {t(
                "외국인·행정 실무에 영향을 주는 최신 법령·고시·공고를 모아 봅니다.",
                "Recent statutes, notices, and announcements relevant to foreign residents and administrative practice."
              )}
              <br />
              {t(
                "※ 원문 확인용 안내이며, 개별 사안에 대한 법률 자문이 아닙니다.",
                "* For reference only; not legal advice for specific cases."
              )}
            </p>
          </Reveal>
          <div className="mt-6 inline-flex rounded-full border border-line bg-surface p-1 text-xs">
            <Link
              href="/gazette?lang=ko"
              className={`px-3 py-1 rounded-full ${lang === "ko" ? "bg-primary text-white" : "text-text-muted"}`}
            >
              KR
            </Link>
            <Link
              href="/gazette?lang=en"
              className={`px-3 py-1 rounded-full ${lang === "en" ? "bg-primary text-white" : "text-text-muted"}`}
            >
              EN
            </Link>
          </div>
        </div>
      </section>

      {/* 본문 */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {outcome.status === "not_configured" ? (
            <NoticeCard
              title={t("관보 게시판 준비 중", "Gazette board — coming soon")}
              body={t(
                "관보 데이터 연동을 준비하고 있습니다. 연동이 완료되면 최신 관보가 이곳에 표시됩니다.",
                "The gazette feed is being connected. Recent gazettes will appear here once it is live."
              )}
            />
          ) : outcome.status === "error" ? (
            <NoticeCard
              title={t("잠시 후 다시 시도해 주세요", "Please try again shortly")}
              body={t(
                "관보 데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.",
                "We could not load the gazette data right now. Please refresh in a moment."
              )}
            />
          ) : items.length === 0 ? (
            <NoticeCard
              title={t("등록된 관보가 없습니다", "No gazettes yet")}
              body={t("표시할 관보가 아직 없습니다.", "There are no gazettes to show yet.")}
            />
          ) : (
            <>
              {/* 구분 필터 */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/gazette${lang === "en" ? "?lang=en" : ""}`}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${!activeCat ? "bg-primary text-white" : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"}`}
                  >
                    {t("전체", "All")}
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/gazette?cat=${encodeURIComponent(cat)}${lang === "en" ? "&lang=en" : ""}`}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${activeCat === cat ? "bg-primary text-white" : "border border-gold/30 bg-surface text-text-muted hover:bg-gold-soft/30"}`}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              )}

              {/* 목록 */}
              <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {board.map((g) => {
                  const inner = (
                    <div className="flex flex-col gap-2 px-5 py-4 transition group-hover:bg-surface-muted sm:flex-row sm:items-start sm:gap-5">
                      <div className="flex shrink-0 items-center gap-2 sm:w-40 sm:flex-col sm:items-start">
                        {g.category && (
                          <span className="inline-block w-fit rounded-full bg-gold-soft/50 px-2.5 py-0.5 font-serif text-[11px] font-bold text-gold-deep">
                            {g.category}
                          </span>
                        )}
                        {g.dateMs > 0 && (
                          <span className="text-[11px] text-text-muted">{fmtDate(g.dateMs)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-sm font-bold leading-snug text-primary group-hover:text-gold-deep">
                          {g.title}
                          {g.url && (
                            <span className="ml-1 text-xs text-text-muted" aria-hidden>↗</span>
                          )}
                        </h3>
                        {g.agency && (
                          <p className="mt-1 text-[11px] text-text-muted">{g.agency}</p>
                        )}
                        {g.summary && (
                          <p className="mt-2 line-clamp-2 text-xs leading-6 text-text-muted">{g.summary}</p>
                        )}
                      </div>
                    </div>
                  );
                  const safeUrl = g.url && /^https?:\/\//i.test(g.url) ? g.url : null; // javascript:/data: 차단
                  return (
                    <li key={g.id}>
                      {safeUrl ? (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="group block"
                        >
                          {inner}
                        </a>
                      ) : (
                        <div className="group block">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-[11px] text-text-muted">
                {t(
                  "관보 원문은 행정안전부 관보(gwanbo.go.kr)에서 확인할 수 있습니다.",
                  "Original gazettes are available at the Ministry of the Interior and Safety (gwanbo.go.kr)."
                )}
              </p>
            </>
          )}
        </div>
      </section>

      {/* 상담 CTA */}
      <section className="ethos-band ethos-band-soft py-24 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Have a question?</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">
              {t("내 사안에 영향이 있나요?", "Does this affect your case?")}
            </h2>
            <p className="mt-4 text-sm leading-7 text-text-muted">
              {t(
                "관보 내용이 본인 사안에 어떤 영향을 주는지 상담을 통해 확인해 드립니다.",
                "We review how a gazette change applies to your specific case in consultation."
              )}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={lang === "en" ? "/intake?lang=en" : "/intake"}
                className="inline-flex h-12 items-center rounded-lg bg-primary px-8 text-sm font-bold text-white transition hover:bg-text-strong"
              >
                {t("상담 신청하기", "Request Consultation")}
              </Link>
              <Link
                href="/quick-check"
                className="inline-flex h-12 items-center rounded-lg border border-primary/40 px-8 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                {t("무료 AI 사전진단", "Free AI case check")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function NoticeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-surface px-6 py-12 text-center">
      <h2 className="ethos-display text-2xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-text-muted">{body}</p>
    </div>
  );
}
