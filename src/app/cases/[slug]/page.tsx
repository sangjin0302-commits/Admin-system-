import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { getPublicCaseBySlug } from "@/lib/public-cases";
import { getDbCaseStudyBySlug, listPublicCaseStudies } from "@/lib/services/case-studies";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getPublicCaseBySlug(slug) ?? (await getDbCaseStudyBySlug(slug));
  if (!c) return { title: "사례를 찾을 수 없습니다" };
  return {
    title: `${c.title} — 처리 사례 | ETHOS 행정사사무소`,
    description: c.summary
  };
}

export default async function CaseDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const richCase = getPublicCaseBySlug(slug);
  const dbCase = richCase ? null : await getDbCaseStudyBySlug(slug);
  const c = richCase ?? dbCase;
  if (!c) notFound();
  // DB 사례는 상세 필드(background/approach 등)가 없으므로 안전 접근
  const hasRich = Boolean(richCase);

  // 관련 사례 (같은 분야 우선, 현재 제외, 최대 3건)
  const allCases = await listPublicCaseStudies();
  const related = [
    ...allCases.filter((x) => x.slug !== c.slug && x.category === c.category),
    ...allCases.filter((x) => x.slug !== c.slug && x.category !== c.category)
  ].slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-16 sm:px-6 sm:py-20">
      {/* Back */}
      <Link href="/cases" className="font-serif text-xs text-text-muted hover:text-primary">
        ← 처리 사례 목록
      </Link>

      {/* Header */}
      <section>
        <span className="inline-block rounded-full bg-gold-soft/60 px-3 py-1 font-serif text-xs font-bold text-gold-deep">
          {c.categoryLabel}
        </span>
        <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          {c.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-text-muted">{c.summary}</p>

        <div className="mt-6 grid gap-3 rounded-xl border border-gold/30 bg-surface-muted/40 p-4 sm:grid-cols-2">
          <div>
            <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">진행 결과</p>
            <p className="mt-1 text-sm font-bold text-text-strong">{c.outcome}</p>
          </div>
          <div>
            <p className="font-serif text-xs uppercase tracking-wider text-gold-deep">소요 기간</p>
            <p className="mt-1 text-sm font-bold text-text-strong">{c.duration}</p>
          </div>
        </div>
      </section>

      {hasRich && richCase && (
        <>
          {/* Background */}
          <Section title="사안 배경">
            <p className="text-sm leading-7 text-text">{richCase.background}</p>
          </Section>

          {/* Approach */}
          <Section title="진행 방법">
            <ol className="space-y-3">
              {richCase.approach.map((a, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg border border-gold/20 bg-surface px-4 py-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary font-serif text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-6 text-text">{a}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* Result */}
          <Section title="결과">
            <Card className="p-5">
              <p className="text-sm leading-7 text-text">{richCase.result}</p>
            </Card>
          </Section>

          {/* Lessons */}
          <Section title="배운 점">
            <ul className="space-y-2">
              {richCase.lessons.map((l, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-7 text-text">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-gold" />
                  {l}
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}

      <p className="rounded-lg border border-gold/30 bg-surface-muted/40 px-4 py-3 text-xs italic text-text-muted">
        ※ 본 사례는 익명화되었으며, 개별 사안의 결과를 보장하지 않습니다.
      </p>

      {/* 관련 사례 */}
      {related.length > 0 && (
        <section>
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">관련 사례 더보기</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/cases/${r.slug}`}
                className="group block rounded-xl border border-gold/20 bg-surface p-5 transition hover:border-gold/50 hover:shadow-panel"
              >
                <span className="inline-block rounded-full bg-gold-soft/50 px-2.5 py-0.5 font-serif text-[11px] font-bold text-gold-deep">
                  {r.categoryLabel}
                </span>
                <h3 className="mt-3 font-serif text-base font-bold leading-snug text-primary group-hover:text-gold-deep">
                  {r.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-6 text-text-muted">{r.summary}</p>
                <span className="mt-3 inline-flex items-center gap-1 font-serif text-xs font-semibold text-primary group-hover:text-gold-deep">
                  자세히 <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-2xl bg-primary p-10 text-center text-white">
        <h2 className="font-serif text-2xl font-bold sm:text-3xl">비슷한 사안이 있으신가요?</h2>
        <Link
          href="/intake"
          className="mt-6 inline-flex h-12 items-center rounded-lg bg-gold px-6 font-bold text-primary transition hover:bg-gold-soft"
        >
          상담 신청
        </Link>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="ethos-rule [&::before]:hidden">
        <span className="whitespace-nowrap">{title}</span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
