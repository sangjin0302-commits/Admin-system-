import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getPublicIntakeControlSnapshot } from "@/lib/services/public-intake-control-service-safe-v3";
import { getSystemHealthSnapshot, type HealthLevel } from "@/lib/services/system-health-service-safe-v2";

type OpsBannerSnapshot = {
  healthLevel: HealthLevel | null;
  healthScore: number | null;
  maintenanceMode: boolean;
};

async function getOpsBannerSnapshot(): Promise<OpsBannerSnapshot> {
  try {
    const [health, intakeControl] = await Promise.all([
      getSystemHealthSnapshot(),
      getPublicIntakeControlSnapshot()
    ]);

    return {
      healthLevel: health.overallLevel,
      healthScore: health.score,
      maintenanceMode: intakeControl.maintenanceMode
    };
  } catch {
    return {
      healthLevel: null,
      healthScore: null,
      maintenanceMode: false
    };
  }
}

function toneByLevel(level: HealthLevel | null) {
  if (level === "critical") return "border-danger/30 bg-danger/5 text-danger";
  if (level === "warn") return "border-warning/30 bg-warning/5 text-warning";
  return "border-success/30 bg-success/5 text-success";
}

function labelByLevel(level: HealthLevel | null) {
  if (level === "critical") return "위험";
  if (level === "warn") return "주의";
  if (level === "ok") return "정상";
  return "확인 필요";
}

export async function AdminOpsBanner() {
  const snapshot = await getOpsBannerSnapshot();
  const hasAttentionNeeded = snapshot.maintenanceMode || snapshot.healthLevel === "critical" || snapshot.healthLevel === "warn";

  if (!hasAttentionNeeded) {
    return null;
  }

  return (
    <Card className="border border-line-strong p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text">운영 알림</span>
          {snapshot.healthLevel ? (
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneByLevel(snapshot.healthLevel)}`}>
              시스템 상태: {labelByLevel(snapshot.healthLevel)}
              {snapshot.healthScore !== null ? ` (${snapshot.healthScore}점)` : ""}
            </span>
          ) : null}
          {snapshot.maintenanceMode ? (
            <span className="rounded-full border border-warning/30 bg-warning/5 px-3 py-1 text-xs font-semibold text-warning">
              공개 접수: 점검 모드
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/monitoring"
            className="inline-flex h-9 items-center rounded-full border border-line-strong bg-surface px-3 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
          >
            모니터링 바로가기
          </Link>
          <Link
            href="/admin/integrations"
            className="inline-flex h-9 items-center rounded-full border border-line-strong bg-surface px-3 text-sm font-medium text-text-strong transition hover:bg-surface-muted"
          >
            접수 제어 바로가기
          </Link>
        </div>
      </div>
    </Card>
  );
}
