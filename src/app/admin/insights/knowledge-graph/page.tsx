import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { KnowledgeGraphClient } from "./client";

export const dynamic = "force-dynamic";

export default async function KnowledgeGraphPage() {
  const enabled = await isFeatureEnabled("knowledge_graph");
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Insights</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">사무소 지식 그래프</h2>
      <p className="mt-2 text-sm text-text-muted">
        사건·의뢰인·판례·법령의 연결을 시각화합니다. 노드를 클릭해 인접 관계를 강조하세요.
      </p>
      {!enabled ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          knowledge_graph 기능이 비활성화되어 있습니다. /admin/features 에서 활성화하세요.
        </p>
      ) : (
        <div className="mt-6">
          <KnowledgeGraphClient />
        </div>
      )}
    </section>
  );
}
