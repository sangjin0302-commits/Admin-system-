import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getReplicaStatus } from "@/lib/services/db-read-replica-service";

export const dynamic = "force-dynamic";

export default async function ReadReplicaPage() {
  const [enabled, status] = await Promise.all([
    isFeatureEnabled("read_replica_routing"),
    getReplicaStatus(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Database"
        title="읽기 복제본 라우팅"
        description="주 DB 부하 감소를 위해 조회 쿼리를 복제본으로 라우팅. 복제본 실패 시 자동 fallback."
      />

      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">
            기능 플래그 <code>read_replica_routing</code>가 꺼져 있습니다.
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-sm font-semibold">주 DB (쓰기)</h3>
          <p className="mt-3 text-sm">
            {status.primary.ok ? "✅ 정상" : "❌ 오류"}
          </p>
          {status.primary.error && (
            <p className="mt-2 text-xs text-error">{status.primary.error}</p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold">읽기 복제본</h3>
          <p className="mt-3 text-sm">
            {!status.replica.configured
              ? "⚠ 미설정 (DATABASE_READ_REPLICA_URL 없음)"
              : status.replica.ok
              ? "✅ 정상"
              : "❌ 오류"}
          </p>
          {status.replica.error && (
            <p className="mt-2 text-xs text-error">{status.replica.error}</p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold">쿼리 분포 (프로세스 시작 이후)</h3>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs text-text-muted">복제본 읽기</dt>
            <dd className="mt-1 font-mono text-lg">{status.stats.readReplica}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">주 DB 읽기</dt>
            <dd className="mt-1 font-mono text-lg">{status.stats.readPrimary}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Fallback</dt>
            <dd className="mt-1 font-mono text-lg">{status.stats.fallbacks}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">쓰기</dt>
            <dd className="mt-1 font-mono text-lg">{status.stats.writesPrimary}</dd>
          </div>
        </dl>
        {status.stats.lastFallbackError && (
          <p className="mt-3 text-xs text-warning">
            최근 fallback: {status.stats.lastFallbackError}
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold">사용법</h3>
        <pre className="mt-3 overflow-x-auto rounded bg-surface-muted p-3 text-xs">
{`import { readPrisma, readWithFallback } from "@/lib/services/db-read-replica-service";

const cases = await readPrisma().case.findMany({ where: { status: "ACTIVE" } });
const cases2 = await readWithFallback((db) => db.case.findMany({...}));`}
        </pre>
        <p className="mt-3 text-xs text-text-muted">
          자세한 가이드: <code>src/lib/services/db-read-replica-usage.md</code>
        </p>
      </Card>
    </div>
  );
}
