import { Card } from "@/components/ui/card";
import { Table, TableContainer } from "@/components/ui/table";
import { getJobs } from "@/lib/services/job-scheduler-service";
import { RunNowButton } from "./run-now-button";

export const dynamic = "force-dynamic";

export default async function ScheduledJobsPage() {
  const jobs = getJobs();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Automation</p>
        <h1 className="mt-2 ui-page-title">예약 작업</h1>
        <p className="mt-2 text-sm text-text-muted">
          정기 실행되는 백그라운드 작업 목록입니다. 수동으로도 실행할 수 있습니다.
        </p>
      </Card>

      <Card className="p-0">
        <TableContainer className="border-0">
          <Table>
            <thead>
              <tr>
                <th className="text-left px-4 py-2">이름</th>
                <th className="text-left px-4 py-2">Cron</th>
                <th className="text-left px-4 py-2">최근 실행</th>
                <th className="text-left px-4 py-2">상태</th>
                <th className="text-left px-4 py-2">활성</th>
                <th className="text-left px-4 py-2">실행</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-2 text-sm font-medium text-text-strong">
                    {job.name}
                    <div className="text-xs text-text-muted">{job.id}</div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{job.cron}</td>
                  <td className="px-4 py-2 text-sm">
                    {job.lastRun ? job.lastRun.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {job.lastRun ? "실행됨" : "대기"}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {job.enabled ? (
                      <span className="rounded bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                        활성
                      </span>
                    ) : (
                      <span className="rounded bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                        비활성
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <RunNowButton jobId={job.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </Card>
    </div>
  );
}
