import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { listTopReengagement } from "@/lib/services/reengagement-service";

import { CampaignPanel } from "./campaign-panel";

export const dynamic = "force-dynamic";

export default async function AdminReengagementPage() {
  const items = await listTopReengagement(50);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="마케팅 · 재수임"
        title="재수임 가능성 점수"
        description="종결 고객 중 12개월 내 재문의 가능성이 높은 대상을 정렬합니다. NPS · 카테고리 · 종결 후 경과 · 이력 기반."
      />
      <CampaignPanel initial={items} />
    </div>
  );
}
