import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getAutoReplyConfig, listPendingAutoReplies } from "@/lib/services/ai-auto-reply-service";

import { AutoReplyQueue } from "./auto-reply-queue";

export const dynamic = "force-dynamic";

export default async function AutoReplyPage() {
  const [queue, config] = await Promise.all([listPendingAutoReplies(), getAutoReplyConfig()]);
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Automation"
        title="AI 대리 회신 자동 승인"
        description="AI가 생성한 회신 초안을 검토하고 승인·수정·거부하거나, 임계 확신도 이상은 자동 발송하도록 설정합니다."
      />
      <Card className="p-6">
        <p className="text-sm text-text-muted">
          기능 플래그 <code>ai_auto_reply</code>가 켜져 있을 때만 신규 문의에 대해 자동 평가가 수행됩니다.
        </p>
      </Card>
      <AutoReplyQueue initialQueue={queue} initialConfig={config} />
    </div>
  );
}
