import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getBackupMirrorConfig, getBackupMirrorHistory } from "@/lib/services/backup-mirror-service";
import { BackupMirrorClient } from "./backup-mirror-client";

export const dynamic = "force-dynamic";

export default async function BackupMirrorPage() {
  const [enabled, cfg, history] = await Promise.all([
    isFeatureEnabled("backup_mirror"),
    getBackupMirrorConfig(),
    getBackupMirrorHistory(),
  ]);
  const safeCfg = {
    ...cfg,
    airtable: { ...cfg.airtable, apiKey: cfg.airtable.apiKey ? `${cfg.airtable.apiKey.slice(0, 6)}…` : "" },
  };
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="Airtable / Google Sheets 미러 백업"
        description="사건·문의를 Airtable 또는 Google Sheets에 실시간·정기 미러링합니다. 매일 03:00 자동 전체 동기."
      />
      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">
            기능 플래그 <code>backup_mirror</code>가 꺼져 있습니다.
          </p>
        </Card>
      )}
      <BackupMirrorClient initialConfig={safeCfg} initialHistory={history} />
    </div>
  );
}
