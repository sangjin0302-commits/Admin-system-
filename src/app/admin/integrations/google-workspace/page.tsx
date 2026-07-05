import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getWorkspaceConfig, getWorkspaceHistory } from "@/lib/services/google-workspace-service";
import { GoogleWorkspaceClient } from "./google-workspace-client";

export const dynamic = "force-dynamic";

export default async function GoogleWorkspacePage() {
  const [enabled, cfg, history] = await Promise.all([
    isFeatureEnabled("google_workspace_admin"),
    getWorkspaceConfig(),
    getWorkspaceHistory(),
  ]);
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="Google Workspace 계정 관리"
        description="사무소 도메인의 Google Workspace 사용자 계정을 생성·중지·재활성화합니다."
      />
      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">기능 플래그 <code>google_workspace_admin</code>가 꺼져 있습니다.</p>
        </Card>
      )}
      <Card className="p-4">
        <p className="text-sm text-text-muted">
          TODO: 서비스 계정에 <b>도메인 전체 위임(domain-wide delegation)</b> 설정이 필요합니다.
          admin.google.com에서 위임 client_id + scope
          <code className="mx-1">https://www.googleapis.com/auth/admin.directory.user</code>를 등록하세요.
        </p>
      </Card>
      <GoogleWorkspaceClient initialConfig={cfg} initialHistory={history} />
    </div>
  );
}
