import { NextResponse } from "next/server";

import { getRestoreSimulation } from "@/lib/services/backup-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const backupId: string = typeof body?.backupId === "string" ? body.backupId : "";
  if (!backupId) {
    return NextResponse.json({ error: "backupId required" }, { status: 400 });
  }
  return NextResponse.json(getRestoreSimulation(backupId));
}
