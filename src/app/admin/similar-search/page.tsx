import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { SimilarSearchClient } from "./similar-search-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "유사 문의 검색 · ETHOS 관리" };

export default async function SimilarSearchPage() {
  if (!(await isFeatureEnabled("inquiry_similar_search"))) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">유사 문의 검색</h1>
        <p className="mt-1 text-sm text-text-muted">
          자연어 검색 → 과거 유사 문의 top 10. 기존 사례로 대응 시간 단축.
        </p>
      </div>
      <SimilarSearchClient />
    </div>
  );
}
