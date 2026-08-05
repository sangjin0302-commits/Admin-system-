import { NextResponse } from "next/server";

import { getRestoreSimulation } from "@/lib/services/backup-service";
import { requireRole } from "@/lib/services/admin-rbac-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const backupId: string = typeof body?.backupId === "string" ? body.backupId : "";
  if (!backupId) {
    return NextResponse.json({ error: "backupId required" }, { status: 400 });
  }
  return NextResponse.json(getRestoreSimulation(backupId));
}
