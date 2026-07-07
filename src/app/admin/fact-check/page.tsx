import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  getFactCheckPolicy,
  getRecentFactChecks,
} from "@/lib/services/fact-check-gate-service";
import FactCheckClient from "./client";

export const dynamic = "force-dynamic";

export default async function AdminFactCheckPage() {
  const [enabled, policy, recent] = await Promise.all([
    isFeatureEnabled("fact_check_gate"),
    getFactCheckPolicy(),
    getRecentFactChecks(),
  ]);
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Practical Accuracy</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">AI 응답 fact-check 게이트</h2>
      <p className="mt-2 text-sm text-text-muted">
        AI 초안의 사실 주장을 판례·법령·의뢰인 데이터와 대조합니다. 상충 발견 시 발송 차단.
        {!enabled && " · feature flag off"}
      </p>
      <div className="mt-6">
        <FactCheckClient policy={policy} recent={recent} enabled={enabled} />
      </div>
    </section>
  );
}
