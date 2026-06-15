import { SearchClient } from "./client";

export const dynamic = "force-dynamic";

export default function AdminSearchPage() {
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">업무 도구</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">통합 검색</h2>
      <p className="mt-2 text-sm text-text-muted">사건·문의·사례를 한 번에 검색합니다. (2글자 이상)</p>
      <div className="mt-6">
        <SearchClient />
      </div>
    </section>
  );
}
