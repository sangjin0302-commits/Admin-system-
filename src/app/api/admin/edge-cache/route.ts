import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  CACHEABLE_PUBLIC_PATHS,
  getRevalidationLog,
  invalidatePath,
  revalidateAll,
} from "@/lib/services/edge-cache-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const log = await getRevalidationLog();
  return NextResponse.json({ paths: CACHEABLE_PUBLIC_PATHS, log });
}

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => ({}))) as {
    path?: string;
    reason?: string;
  };

  if (body.path) {
    await invalidatePath(body.path, body.reason ?? "수동");
    return NextResponse.json({ ok: true, path: body.path });
  }
  const r = await revalidateAll();
  return NextResponse.json({ ok: true, count: r.count });
}
