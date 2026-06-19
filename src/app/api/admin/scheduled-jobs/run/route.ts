import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { runJob } from "@/lib/services/job-scheduler-service";

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.scheduled-jobs.run");
  const parsed = await safeReadJsonBody(request);
  if (!parsed.ok) {
    return api.error(400, "잘못된 요청 본문", { code: "INVALID_BODY" });
  }
  const jobId = (parsed.body as { jobId?: string })?.jobId;
  if (!jobId || typeof jobId !== "string") {
    return api.error(400, "jobId가 필요합니다", { code: "MISSING_JOB_ID" });
  }
  try {
    const result = await runJob(jobId);
    return api.ok({ ok: true, ...result });
  } catch (error) {
    api.logError(error);
    return api.error(500, "잡 실행 실패", { code: "JOB_RUN_FAILED" });
  }
}
