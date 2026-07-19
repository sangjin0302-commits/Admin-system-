import { Card } from "@/components/ui/card";
import { searchSimilar, getStats } from "@/lib/services/vector-search-service";
import { AddDocForm } from "./add-doc-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function VectorSearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const results = q ? await searchSimilar(q, 10) : [];
  const stats = getStats();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <p className="ui-kicker">지식 베이스</p>
        <h1 className="ui-page-title">자료 검색 (RAG)</h1>
        <p className="mt-1 text-sm text-text-muted">
          문서 {stats.docCount}건 · 임베딩 차원 {stats.avgEmbeddingDim}
        </p>
      </div>

      <Card className="mb-6">
        <form method="get" className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="자료를 검색합니다…"
            className="ui-input flex-1"
          />
          <button type="submit" className="ui-button-primary">
            검색
          </button>
        </form>
      </Card>

      {q && (
        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-text-strong">
            &ldquo;{q}&rdquo; 검색 결과
          </h2>
          {results.length === 0 ? (
            <p className="text-sm text-text-muted">일치하는 문서가 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {results.map((r) => (
                <li key={r.id} className="border-b border-border-subtle pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-strong">
                      {r.metadata.title ?? r.id}
                    </span>
                    <span className="text-xs text-text-muted">
                      유사도 {r.score.toFixed(4)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-default line-clamp-3">{r.content}</p>
                  {r.metadata.tags && (
                    <p className="mt-1 text-xs text-text-muted">태그: {r.metadata.tags}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-text-strong">문서 추가</h2>
        <AddDocForm />
      </Card>
    </div>
  );
}
