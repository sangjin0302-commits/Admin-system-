import type { Metadata } from "next";
import Link from "next/link";

import { listQuestions, COMMUNITY_CATEGORIES } from "@/lib/services/community-service";

export const metadata: Metadata = {
  title: "행정 Q&A 커뮤니티 | 에토스 행정사사무소(ETHOS)",
  description:
    "비자·행정심판·계약·인허가 등 실무 질문에 대한 행정사 답변을 모아둔 커뮤니티. 궁금한 점을 남기시면 확인 후 답변드립니다.",
};

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const { items, total, perPage } = await listQuestions({
    publicOnly: true,
    category,
    search,
    page,
    perPage: 20,
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-8">
        <p className="ui-kicker">COMMUNITY</p>
        <h1 className="mt-2 text-3xl font-bold text-text-strong">행정 Q&A</h1>
        <p className="mt-2 text-sm text-text-muted">
          실무 질문에 대한 행정사 답변을 공개 아카이브로 남깁니다. 궁금한 점은 아래
          <Link href="/community/ask" className="mx-1 text-primary underline">
            질문 남기기
          </Link>
          에서 남겨주세요.
        </p>
      </header>

      <form className="mb-6 flex flex-wrap gap-2" action="/community">
        <input
          type="search"
          name="search"
          defaultValue={search ?? ""}
          placeholder="키워드 검색"
          className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">전체 분야</option>
          {COMMUNITY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          검색
        </button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border p-8 text-center text-sm text-text-muted">
          아직 답변된 Q&A가 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((q) => (
            <li key={q.id} className="rounded-2xl border border-border bg-white p-4 transition hover:shadow-sm">
              <Link href={`/community/${q.id}`} className="block">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="rounded bg-surface-muted px-2 py-0.5">{q.category}</span>
                  <span>{new Date(q.askedAt).toLocaleDateString("ko-KR")}</span>
                </div>
                <h2 className="mt-2 line-clamp-2 text-base font-semibold text-text-strong">
                  Q. {q.title}
                </h2>
                {q.answer && (
                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                    A. {q.answer.replace(/<[^>]+>/g, " ").slice(0, 160)}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const sp = new URLSearchParams();
            if (category) sp.set("category", category);
            if (search) sp.set("search", search);
            sp.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/community?${sp.toString()}`}
                className={`rounded px-3 py-1 ${
                  p === page ? "bg-primary text-white" : "border border-border"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}
    </main>
  );
}
