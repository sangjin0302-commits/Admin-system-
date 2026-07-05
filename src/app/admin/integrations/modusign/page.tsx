import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  listTemplates,
  listOutbox,
  getCredentialStatus,
} from "@/lib/services/modusign-integration";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { ModusignClient } from "./modusign-client";

export const dynamic = "force-dynamic";

export default async function ModusignPage() {
  const [enabled, templates, outbox] = await Promise.all([
    isFeatureEnabled("modusign_esign"),
    listTemplates(),
    listOutbox(),
  ]);
  const creds = getCredentialStatus();
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="모두싸인 전자계약"
        description="위임장·수임 계약서 등을 모두싸인 API로 발송하고 서명 상태를 추적합니다."
      />
      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">모두싸인 연동이 비활성 상태입니다.</p>
        </Card>
      )}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">연동 상태</h3>
        <div className="mt-3 space-y-1 text-sm text-text-muted">
          <div>MODUSIGN_API_KEY: {creds.apiKey ? "설정됨" : "미설정 (스텁 템플릿)"}</div>
          <div>MODUSIGN_SECRET (webhook): {creds.secret ? "설정됨" : "미설정"}</div>
          <div>Webhook URL: <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">POST /api/webhooks/modusign</code></div>
        </div>
      </Card>

      <ModusignClient initialTemplates={templates} initialOutbox={outbox} />
    </div>
  );
}
