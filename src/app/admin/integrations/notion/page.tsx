import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getNotionConfig, getNotionHistory } from "@/lib/services/notion-integration-service";
import { NotionClient } from "./notion-client";

export const dynamic = "force-dynamic";

export default async function NotionIntegrationPage() {
  const [enabled, cfg, history] = await Promise.all([
    isFeatureEnabled("notion_sync"),
    getNotionConfig(),
    getNotionHistory(),
  ]);
  const safeCfg = { ...cfg, apiToken: cfg.apiToken ? `${cfg.apiToken.slice(0, 6)}…` : "" };
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="Notion 사건 동기화"
        description="사건·문의를 Notion 데이터베이스 페이지로 자동 생성·업데이트하고, Notion에서의 편집을 폴링합니다."
      />
      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">
            기능 플래그 <code>notion_sync</code>가 꺼져 있습니다. 관리자 &gt; 기능 플래그에서 활성화하세요.
          </p>
        </Card>
      )}
      <NotionClient initialConfig={safeCfg} initialHistory={history} />
    </div>
  );
}
