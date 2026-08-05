import { NextResponse } from "next/server";

import { cacheClear } from "@/lib/services/cache-service";
import { requireRole } from "@/lib/services/admin-rbac-service";

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER"]);
  if (!guard.ok) return guard.response;

  cacheClear();
  return NextResponse.json({ success: true });
}
