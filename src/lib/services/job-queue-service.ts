/**
 * 잡 큐 시스템 — BullMQ 없이 자체 구현.
 *
 * 저장: SiteSetting key = "jobs.queue" (JSON array of Job)
 * 처리: /api/cron/queue-worker 가 1분마다 processNext 호출 (최대 10건)
 * 재시도: 지수 백오프, maxAttempts=3
 *
 * 핸들러 등록: registerHandler("send-email", async (payload) => { ... })
 * 큐 추가:     await enqueue("send-email", { to, subject, body })
 */

import { prisma } from "@/lib/prisma/client";
import { logger } from "@/lib/utils/logger";

const STORE_KEY = "jobs.queue";
const MAX_JOBS_IN_STORE = 500; // done/failed 오래된 것부터 정리

export type JobStatus = "pending" | "running" | "done" | "failed";

export type Job<P = unknown> = {
  id: string;
  name: string;
  payload: P;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledFor?: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
};

export type EnqueueOptions = {
  maxAttempts?: number;
  delayMs?: number;
  id?: string;
};

type Handler = (payload: unknown, job: Job) => Promise<void> | void;
const handlers = new Map<string, Handler>();

export function registerHandler(name: string, fn: Handler): void {
  handlers.set(name, fn);
}

export function listRegisteredHandlers(): string[] {
  return Array.from(handlers.keys());
}

function newId(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readQueue(): Promise<Job[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: STORE_KEY } });
    if (!row?.value) return [];
    const arr = JSON.parse(row.value);
    return Array.isArray(arr) ? (arr as Job[]) : [];
  } catch (err) {
    logger.warn("[job-queue] 큐 읽기 실패", err);
    return [];
  }
}

async function writeQueue(jobs: Job[]): Promise<void> {
  // 완료된 오래된 잡 정리
  let trimmed = jobs;
  if (trimmed.length > MAX_JOBS_IN_STORE) {
    const active = trimmed.filter((j) => j.status === "pending" || j.status === "running");
    const finished = trimmed
      .filter((j) => j.status === "done" || j.status === "failed")
      .sort((a, b) => (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt));
    trimmed = [...active, ...finished.slice(0, MAX_JOBS_IN_STORE - active.length)];
  }
  const value = JSON.stringify(trimmed);
  await prisma.siteSetting.upsert({
    where: { key: STORE_KEY },
    create: { key: STORE_KEY, value },
    update: { value },
  });
}

export async function enqueue<P>(name: string, payload: P, options: EnqueueOptions = {}): Promise<Job<P>> {
  const now = Date.now();
  const job: Job<P> = {
    id: options.id ?? newId(),
    name,
    payload,
    status: "pending",
    attempts: 0,
    maxAttempts: options.maxAttempts ?? 3,
    createdAt: new Date(now).toISOString(),
    scheduledFor: options.delayMs ? new Date(now + options.delayMs).toISOString() : undefined,
  };
  const jobs = await readQueue();
  jobs.push(job as Job);
  await writeQueue(jobs);
  return job;
}

/** 다음 대기 잡 하나 처리 (성공/실패 후 상태 저장). */
export async function processNext(): Promise<{ processed: boolean; job?: Job; error?: string }> {
  const jobs = await readQueue();
  const now = new Date().toISOString();
  const idx = jobs.findIndex(
    (j) => j.status === "pending" && (!j.scheduledFor || j.scheduledFor <= now)
  );
  if (idx === -1) return { processed: false };

  const job = jobs[idx];
  job.status = "running";
  job.startedAt = now;
  job.attempts += 1;
  await writeQueue(jobs);

  const handler = handlers.get(job.name);
  if (!handler) {
    job.status = "failed";
    job.error = `핸들러 미등록: ${job.name}`;
    job.finishedAt = new Date().toISOString();
    await writeQueue(jobs);
    return { processed: true, job, error: job.error };
  }

  try {
    await handler(job.payload, job);
    job.status = "done";
    job.finishedAt = new Date().toISOString();
    delete job.error;
    await writeQueue(jobs);
    return { processed: true, job };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (job.attempts >= job.maxAttempts) {
      job.status = "failed";
      job.error = msg;
      job.finishedAt = new Date().toISOString();
    } else {
      // 지수 백오프: 2^attempts 분
      const backoffMs = Math.pow(2, job.attempts) * 60_000;
      job.status = "pending";
      job.scheduledFor = new Date(Date.now() + backoffMs).toISOString();
      job.error = msg;
    }
    await writeQueue(jobs);
    return { processed: true, job, error: msg };
  }
}

export async function processBatch(limit = 10): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  for (let i = 0; i < limit; i++) {
    const r = await processNext();
    if (!r.processed) break;
    processed += 1;
    if (r.error) failed += 1;
  }
  return { processed, failed };
}

export async function getStats(): Promise<{
  pending: number;
  running: number;
  done: number;
  failed: number;
  total: number;
}> {
  const jobs = await readQueue();
  const stats = { pending: 0, running: 0, done: 0, failed: 0, total: jobs.length };
  for (const j of jobs) stats[j.status] += 1;
  return stats;
}

export async function listJobs(limit = 100): Promise<Job[]> {
  const jobs = await readQueue();
  return jobs
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function retryJob(id: string): Promise<Job | null> {
  const jobs = await readQueue();
  const job = jobs.find((j) => j.id === id);
  if (!job) return null;
  job.status = "pending";
  job.attempts = 0;
  job.scheduledFor = undefined;
  job.error = undefined;
  job.startedAt = undefined;
  job.finishedAt = undefined;
  await writeQueue(jobs);
  return job;
}

export async function cancelJob(id: string): Promise<boolean> {
  const jobs = await readQueue();
  const job = jobs.find((j) => j.id === id);
  if (!job) return false;
  if (job.status === "running" || job.status === "done") return false;
  job.status = "failed";
  job.error = "취소됨";
  job.finishedAt = new Date().toISOString();
  await writeQueue(jobs);
  return true;
}

/**
 * 예시 핸들러 등록 — 관리자 테스트용 (즉시 성공).
 * 다른 서비스는 앱 부팅 시 각자 registerHandler 호출.
 */
registerHandler("noop", async () => {
  // 아무것도 안 함 — 큐 파이프라인 테스트용
});

registerHandler("log", async (payload) => {
  logger.info("[job:log]", payload);
});
