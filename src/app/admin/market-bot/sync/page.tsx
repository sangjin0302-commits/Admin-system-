import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { FullSyncControls } from "./sync-controls";

export const dynamic = "force-dynamic";

export default function MarketSyncPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Market"
        title="동기화 센터"
        description="market-analyze 데이터 수집·인덱싱·Notion 동기화 작업을 실행합니다."
      />
      <Card className="p-6">
        <h3 className="ui-section-title">실행</h3>
        <p className="mt-1 text-xs text-text-muted">
          각 작업은 서버사이드 프록시(/api/admin/market-bot/proxy/*)를 통해 호출되며 토큰은 클라이언트에 노출되지 않습니다.
        </p>
        <div className="mt-4">
          <FullSyncControls />
        </div>
      </Card>
    </div>
  );
}
