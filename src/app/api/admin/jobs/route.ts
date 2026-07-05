import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  cancelJob,
  enqueue,
  getStats,
  listJobs,
  listRegisteredHandlers,
  retryJob,
} from "@/lib/services/job-queue-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const [stats, jobs] = await Promise.all([getStats(), listJobs(100)]);
  return NextResponse.json({
    stats,
    jobs,
    handlers: listRegisteredHandlers(),
  });
}

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => ({}))) as {
    action?: "enqueue" | "retry" | "cancel";
    name?: string;
    payload?: unknown;
    id?: string;
    maxAttempts?: number;
    delayMs?: number;
  };

  if (body.action === "retry" && body.id) {
    const job = await retryJob(body.id);
    if (!job) return NextResponse.json({ ok: false, error: "잡을 찾을 수 없음" }, { status: 404 });
    return NextResponse.json({ ok: true, job });
  }
  if (body.action === "cancel" && body.id) {
    const ok = await cancelJob(body.id);
    return NextResponse.json({ ok });
  }
  if (body.action === "enqueue" || (!body.action && body.name)) {
    if (!body.name) return NextResponse.json({ ok: false, error: "name 필드 필요" }, { status: 400 });
    const job = await enqueue(body.name, body.payload ?? {}, {
      ...(body.maxAttempts != null ? { maxAttempts: body.maxAttempts } : {}),
      ...(body.delayMs != null ? { delayMs: body.delayMs } : {}),
    });
    return NextResponse.json({ ok: true, job });
  }
  return NextResponse.json({ ok: false, error: "알 수 없는 action" }, { status: 400 });
}
