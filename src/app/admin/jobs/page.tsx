import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  getStats,
  listJobs,
  listRegisteredHandlers,
} from "@/lib/services/job-queue-service";
import { JobsClient } from "./jobs-client";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const [enabled, stats, jobs] = await Promise.all([
    isFeatureEnabled("job_queue"),
    getStats(),
    listJobs(100),
  ]);
  const handlers = listRegisteredHandlers();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Infrastructure"
        title="잡 큐"
        description="자체 구현 백그라운드 잡 큐. 매분 워커가 최대 10건 처리. 지수 백오프 재시도(max 3)."
      />

      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">
            기능 플래그 <code>job_queue</code>가 꺼져 있습니다. 워커는 중단됩니다.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {(["pending", "running", "done", "failed", "total"] as const).map((k) => (
          <Card key={k} className="p-4">
            <p className="text-xs text-text-muted">{k}</p>
            <p className="mt-1 font-mono text-2xl">{stats[k]}</p>
          </Card>
        ))}
      </div>

      <JobsClient initialJobs={jobs} handlers={handlers} />
    </div>
  );
}
