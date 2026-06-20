import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { listBackups } from "@/lib/services/backup-service";

import { BackupControls } from "./backup-controls";

export const dynamic = "force-dynamic";

export default function BackupPage() {
  const initial = listBackups().map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
  }));
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Operations"
        title="데이터 백업 / 복원"
        description="주요 테이블의 스냅샷을 생성하고 복원 시나리오를 시뮬레이션합니다."
      />
      <Card className="p-6">
        <p className="text-sm text-text-muted">
          복원은 시뮬레이션 전용입니다. 실제 데이터는 변경되지 않으며, 프로덕션에서는 S3 등 외부
          스토리지 연동이 필요합니다.
        </p>
      </Card>
      <BackupControls initial={initial} />
    </div>
  );
}
