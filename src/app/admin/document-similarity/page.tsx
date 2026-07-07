import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  listReuseLinks,
  recentDraftsWithSimilarity,
} from "@/lib/services/document-similarity-service";
import DocumentSimilarityClient from "./client";

export const dynamic = "force-dynamic";

export default async function DocumentSimilarityPage() {
  const [enabled, recent, links] = await Promise.all([
    isFeatureEnabled("document_similarity"),
    recentDraftsWithSimilarity(20),
    listReuseLinks(),
  ]);
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Practical Accuracy</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">문서 유사도·표절 감지</h2>
      <p className="mt-2 text-sm text-text-muted">
        신규 초안이 사무소 기존 문서와 얼마나 유사한지 감지합니다 (n-gram Jaccard). 0.7 초과 시 재사용
        추적을 권장합니다.
        {!enabled && " · feature flag off"}
      </p>
      <div className="mt-6">
        <DocumentSimilarityClient recent={recent} links={links} enabled={enabled} />
      </div>
    </section>
  );
}
