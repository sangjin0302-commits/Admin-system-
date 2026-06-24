import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import { createBackup, listBackups } from "@/lib/services/backup-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  return NextResponse.json({ backups: listBackups() });
}

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const snapshot = await createBackup();
  return NextResponse.json({ snapshot });
}
