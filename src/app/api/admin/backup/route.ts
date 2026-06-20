import { NextResponse } from "next/server";

import { createBackup, listBackups } from "@/lib/services/backup-service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ backups: listBackups() });
}

export async function POST() {
  const snapshot = await createBackup();
  return NextResponse.json({ snapshot });
}
