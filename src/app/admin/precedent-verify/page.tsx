import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  getCacheStats,
  getRecentFailures,
} from "@/lib/services/precedent-live-verifier";
import PrecedentVerifyClient from "./client";

export const dynamic = "force-dynamic";

export default async function PrecedentVerifyPage() {
  const [enabled, stats, failures] = await Promise.all([
    isFeatureEnabled("precedent_live_verify"),
    getCacheStats(),
    getRecentFailures(),
  ]);
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Practical Accuracy</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">판례 인용 실시간 재확인</h2>
      <p className="mt-2 text-sm text-text-muted">
        로컬 DB → Lawbot → law.go.kr 캐시 순으로 판례번호를 재확인합니다. 24시간 캐시.
        {!enabled && " · feature flag off"}
      </p>
      <div className="mt-6">
        <PrecedentVerifyClient stats={stats} failures={failures} enabled={enabled} />
      </div>
    </section>
  );
}
