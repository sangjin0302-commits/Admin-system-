import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { PAGE_TIERS, TIER_LABELS, TIER_LIST, type PageTier } from "@/lib/services/admin-page-tiers";
import { HideModeClient } from "./hide-mode-client";

export const dynamic = "force-dynamic";

export default async function HideModePage() {
  const hideMode = await isFeatureEnabled("admin_hide_mode");
  const showAdvanced = await isFeatureEnabled("admin_show_advanced");

  // group PAGE_TIERS by tier
  const grouped: Record<PageTier, string[]> = {
    core: [],
    frequent: [],
    occasional: [],
    advanced: [],
  };
  for (const [path, tier] of Object.entries(PAGE_TIERS)) {
    grouped[tier].push(path);
  }
  for (const t of TIER_LIST) grouped[t].sort();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
        <h1 className="text-xl font-semibold text-text-strong">감춤 모드 (Hide Mode)</h1>
        <p className="mt-2 text-sm text-text-muted">
          사이드바에서 자주 쓰지 않는 페이지를 <b>숨김</b>으로 처리합니다.
          <b>삭제하지 않으며</b> 플래그·데이터는 그대로 유지됩니다.
          Ctrl+K 명령 팔레트로 언제든 접근 가능합니다.
        </p>
        <ul className="mt-3 list-disc pl-5 text-xs text-text-muted space-y-1">
          <li>기본: <b>핵심(core)</b> tier만 노출 → 사이드바 항목 ~15개</li>
          <li>고급 페이지까지 보려면 "고급 페이지 표시" 토글 ON</li>
          <li>Ctrl+K 검색은 숨김 페이지도 여전히 찾을 수 있음 (탈출구)</li>
        </ul>
      </div>

      <HideModeClient
        initialHideMode={hideMode}
        initialShowAdvanced={showAdvanced}
        grouped={grouped}
        tierLabels={TIER_LABELS}
        tiers={TIER_LIST}
      />
    </div>
  );
}
