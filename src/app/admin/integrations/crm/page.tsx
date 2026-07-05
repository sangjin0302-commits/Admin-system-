import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getCrmConfig, getCrmHistory } from "@/lib/services/crm-integration-service";
import { CrmClient } from "./crm-client";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const [enabled, cfg, history] = await Promise.all([
    isFeatureEnabled("crm_integration"),
    getCrmConfig(),
    getCrmHistory(),
  ]);
  const safeCfg = {
    ...cfg,
    hubspot: { apiKey: cfg.hubspot.apiKey ? `${cfg.hubspot.apiKey.slice(0, 6)}…` : "" },
    salesforce: {
      instanceUrl: cfg.salesforce.instanceUrl,
      token: cfg.salesforce.token ? `${cfg.salesforce.token.slice(0, 6)}…` : "",
    },
  };
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="HubSpot / Salesforce CRM"
        description="문의는 Contact, 사건은 Deal/Opportunity로 CRM에 동기화합니다."
      />
      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">기능 플래그 <code>crm_integration</code>가 꺼져 있습니다.</p>
        </Card>
      )}
      <CrmClient initialConfig={safeCfg} initialHistory={history} />
    </div>
  );
}
