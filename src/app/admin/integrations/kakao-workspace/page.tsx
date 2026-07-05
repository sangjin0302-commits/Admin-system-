import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { COMMAND_REFERENCE, listInteractions } from "@/lib/services/kakao-workspace-bot";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { KakaoWorkspaceClient } from "./kakao-workspace-client";

export const dynamic = "force-dynamic";

export default async function KakaoWorkspacePage() {
  const [enabled, interactions] = await Promise.all([
    isFeatureEnabled("kakao_workspace_bot"),
    listInteractions(30),
  ]);
  const secret = Boolean(process.env.KAKAO_WORKSPACE_SECRET?.trim());
  const token = Boolean(process.env.KAKAO_WORKSPACE_TOKEN?.trim());

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="카카오 워크스페이스 봇"
        description="카카오톡 채널에서 관리자 명령으로 시스템을 조작합니다."
      />
      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">카카오 워크스페이스 봇 기능이 비활성 상태입니다.</p>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">연동 설정</h3>
        <div className="mt-3 space-y-1 text-sm text-text-muted">
          <div>KAKAO_WORKSPACE_SECRET: {secret ? "설정됨" : "미설정"}</div>
          <div>KAKAO_WORKSPACE_TOKEN: {token ? "설정됨" : "미설정 (dry-run 응답)"}</div>
          <div>Webhook URL: <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">POST /api/webhooks/kakao-workspace</code></div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">명령어 레퍼런스</h3>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {COMMAND_REFERENCE.map((c) => (
              <tr key={c.cmd} className="border-b border-line">
                <td className="py-2 font-mono text-xs">{c.cmd}</td>
                <td className="py-2 text-text-muted">{c.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <KakaoWorkspaceClient initialInteractions={interactions} />
    </div>
  );
}
