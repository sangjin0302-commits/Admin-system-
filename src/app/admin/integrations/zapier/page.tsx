import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { listSubscriptions, getZapierHistory, ZAPIER_EVENTS } from "@/lib/services/zapier-webhook-service";
import { ZapierClient } from "./zapier-client";

export const dynamic = "force-dynamic";

export default async function ZapierPage() {
  const [enabled, subs, history] = await Promise.all([
    isFeatureEnabled("zapier_webhooks"),
    listSubscriptions(),
    getZapierHistory(),
  ]);
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="Zapier / Make 웹훅"
        description="지정된 이벤트가 발생하면 등록된 웹훅에 POST를 발송합니다."
      />
      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">기능 플래그 <code>zapier_webhooks</code>가 꺼져 있습니다.</p>
        </Card>
      )}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">페이로드 예시</h3>
        <pre className="mt-3 overflow-x-auto rounded bg-surface-muted p-3 text-xs">
{`POST <url>
X-Webhook-Event: new_inquiry
X-Webhook-Secret: <secret>

{
  "event": "new_inquiry",
  "at": "2026-07-05T00:00:00.000Z",
  "payload": { ... }
}`}
        </pre>
      </Card>
      <ZapierClient initialSubs={subs} initialHistory={history} events={[...ZAPIER_EVENTS]} />
    </div>
  );
}
