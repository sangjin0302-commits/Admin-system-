import { NextResponse } from "next/server";

import { requireRole } from "@/lib/services/admin-rbac-service";
import {
  bulkMigrateStatus,
  getRecentUploads,
  isConfigured,
  uploadImage,
} from "@/lib/services/cloudflare-images-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const [recent, migration] = await Promise.all([getRecentUploads(), bulkMigrateStatus()]);
  return NextResponse.json({
    configured: isConfigured(),
    recent,
    migration,
  });
}

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      base64?: string;
      filename?: string;
      contentType?: string;
    };
    if (!body.base64) {
      return NextResponse.json({ ok: false, error: "base64 필드 필요" }, { status: 400 });
    }
    const buffer = Buffer.from(body.base64, "base64");
    const r = await uploadImage(buffer, {
      filename: body.filename ?? "upload.bin",
      ...(body.contentType ? { contentType: body.contentType } : {}),
    });
    return NextResponse.json(r);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "요청 실패" },
      { status: 400 }
    );
  }
}
