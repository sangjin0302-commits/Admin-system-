import { FeatureTogglePanel } from "@/components/admin/feature-toggle-panel";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "기능 플래그 — 관리자",
};

export default function AdminFeaturesPage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Feature Flags</p>
        <h1 className="mt-2 ui-page-title">기능 플래그</h1>
        <p className="mt-2 text-sm text-text-muted">
          사이트에서 실험 중이거나 특정 상황에만 사용하는 기능을 켜고 끕니다. 변경 사항은 즉시 저장됩니다.
        </p>
      </Card>
      <FeatureTogglePanel />
    </div>
  );
}
