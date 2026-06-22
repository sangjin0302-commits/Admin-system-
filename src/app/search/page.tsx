import type { Metadata } from "next";
import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "통합 검색 | ETHOS 행정사사무소",
  description: "업무분야, 사례, 블로그 글을 한 번에 검색합니다.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="ui-kicker">Search</p>
      <h1 className="ethos-display mt-2 text-3xl sm:text-4xl">통합 검색</h1>
      <p className="mt-2 text-sm text-text-muted">
        업무분야 · 성공사례 · 블로그 글을 한 번에 검색합니다.
      </p>

      <div className="mt-8">
        <SearchClient />
      </div>
    </div>
  );
}
