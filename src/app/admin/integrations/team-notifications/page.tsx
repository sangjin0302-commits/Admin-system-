import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getTeamNotificationConfig } from "@/lib/services/team-notification-service";

import { TeamNotificationsControls } from "./team-notifications-controls";

export const dynamic = "force-dynamic";

export default async function TeamNotificationsPage() {
  const config = await getTeamNotificationConfig();
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integrations"
        title="Slack / Discord 알림"
        description="주요 이벤트를 Slack·Discord 웹훅으로 이중 전송합니다."
      />
      <Card className="p-6">
        <p className="text-sm text-text-muted">
          환경변수 <code>SLACK_WEBHOOK_URL</code>, <code>DISCORD_WEBHOOK_URL</code>이 설정되어 있어야 실제 전송됩니다.
        </p>
      </Card>
      <TeamNotificationsControls initial={config} />
    </div>
  );
}
