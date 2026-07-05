import { NextResponse } from "next/server";
import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  autoPromoteIfBetter,
  listVersions,
  rollback,
  saveVersion,
  setActive,
  setPinned,
} from "@/lib/services/prompt-optimizer-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const url = new URL(req.url);
  const service = url.searchParams.get("service");
  if (!service) return NextResponse.json({ error: "service required" }, { status: 400 });
  const versions = await listVersions(service);
  return NextResponse.json({ ok: true, versions });
}

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;
  const body = await req.json().catch(() => ({}));
  const { action, service, prompt, versionId, pinned, createdBy, activate } = body ?? {};
  if (!action || !service) return NextResponse.json({ error: "action, service required" }, { status: 400 });

  try {
    if (action === "save") {
      if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });
      const v = await saveVersion({ service, prompt, createdBy, activate: !!activate });
      return NextResponse.json({ ok: true, version: v });
    }
    if (action === "activate") {
      if (!versionId) return NextResponse.json({ error: "versionId required" }, { status: 400 });
      await setActive(service, versionId);
      return NextResponse.json({ ok: true });
    }
    if (action === "pin") {
      if (!versionId) return NextResponse.json({ error: "versionId required" }, { status: 400 });
      await setPinned(service, versionId, !!pinned);
      return NextResponse.json({ ok: true });
    }
    if (action === "rollback") {
      await rollback(service);
      return NextResponse.json({ ok: true });
    }
    if (action === "auto-promote") {
      const r = await autoPromoteIfBetter(service);
      return NextResponse.json({ ok: true, ...r });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
