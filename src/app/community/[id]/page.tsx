import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getQuestion, incrementView } from "@/lib/services/community-service";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const q = await getQuestion(id);
  if (!q || q.status !== "ANSWERED") {
    return { title: "Q&A | 에토스 행정사사무소(ETHOS)" };
  }
  const description = (q.answer ?? q.body).replace(/<[^>]+>/g, " ").slice(0, 160);
  return {
    title: `${q.title} | ETHOS 행정 Q&A`,
    description,
    openGraph: {
      title: q.title,
      description,
      type: "article",
    },
  };
}

export const dynamic = "force-dynamic";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const q = await getQuestion(id);
  if (!q || q.status !== "ANSWERED") notFound();

  // Fire-and-forget
  void incrementView(id);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: q.title,
        acceptedAnswer: {
          "@type": "Answer",
          text: (q.answer ?? "").replace(/<[^>]+>/g, " "),
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="mb-6 text-xs text-text-muted">
        <Link href="/community" className="hover:underline">
          커뮤니티
        </Link>
        <span className="mx-1">›</span>
        <span>{q.category}</span>
      </nav>

      <article className="rounded-2xl border border-border bg-white p-6 sm:p-8">
        <div className="mb-3 flex items-center gap-2 text-xs text-text-muted">
          <span className="rounded bg-surface-muted px-2 py-0.5">{q.category}</span>
          <span>{new Date(q.askedAt).toLocaleDateString("ko-KR")}</span>
          {q.viewCount !== undefined && q.viewCount > 0 && (
            <span>· 조회 {q.viewCount}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-text-strong">Q. {q.title}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-text-strong">{q.body}</p>

        {q.answer && (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="mb-3 text-base font-semibold text-primary">A. 행정사 답변</h2>
            <div
              className="prose prose-sm max-w-none text-text-strong"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.answer) }}
            />
            {q.answeredAt && (
              <p className="mt-4 text-xs text-text-muted">
                답변일: {new Date(q.answeredAt).toLocaleDateString("ko-KR")}
                {q.answeredBy ? ` · ${q.answeredBy}` : ""}
              </p>
            )}
          </div>
        )}
      </article>

      <div className="mt-8 rounded-2xl border border-border bg-surface-muted/30 p-6 text-center">
        <p className="text-sm text-text-muted">비슷한 상황이신가요?</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link
            href="/community/ask"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold"
          >
            질문 남기기
          </Link>
          <Link
            href="/contact"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            개별 상담 요청
          </Link>
        </div>
      </div>
    </main>
  );
}
