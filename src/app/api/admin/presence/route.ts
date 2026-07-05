import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  broadcastAction,
  getActivePresence,
  getCurrentEditor,
  heartbeat,
} from "@/lib/services/multi-admin-sync-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER", "STAFF", "EXTERNAL", "AUDITOR"]);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const active = await getActivePresence();
  let editor = null;
  if (entityType && entityId) {
    editor = await getCurrentEditor(entityType, entityId, guard.user.email);
  }
  return NextResponse.json({ active, editor });
}

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER", "STAFF", "EXTERNAL", "AUDITOR"]);
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => ({}))) as {
    action?: "heartbeat" | "broadcast";
    currentPath?: string;
    editingEntityType?: string;
    editingEntityId?: string;
    adminName?: string;
    broadcastAction?: string;
  };

  if (body.action === "broadcast" && body.broadcastAction) {
    broadcastAction({
      action: body.broadcastAction,
      adminId: guard.user.email,
      ...(body.adminName ? { adminName: body.adminName } : {}),
      ...(body.editingEntityType ? { entityType: body.editingEntityType } : {}),
      ...(body.editingEntityId ? { entityId: body.editingEntityId } : {}),
    });
    return NextResponse.json({ ok: true });
  }

  const list = await heartbeat({
    adminId: guard.user.email,
    ...(body.adminName ? { adminName: body.adminName } : {}),
    ...(body.currentPath ? { currentPath: body.currentPath } : {}),
    ...(body.editingEntityType ? { editingEntityType: body.editingEntityType } : {}),
    ...(body.editingEntityId ? { editingEntityId: body.editingEntityId } : {}),
  });
  return NextResponse.json({ ok: true, active: list });
}
