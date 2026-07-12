import { NextResponse } from "next/server";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { listOrganizations, createOrganization } from "@/lib/services/organization-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/organizations — 조직 목록 */
export async function GET(req: Request) {
  createAdminRequestContext("admin.organizations.list");
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const orgs = await listOrganizations();
    return NextResponse.json({ ok: true, data: orgs });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to list organizations" },
      { status: 500 }
    );
  }
}

/** POST /api/admin/organizations — 조직 생성 */
export async function POST(req: Request) {
  createAdminRequestContext("admin.organizations.create");
  const guard = await requireRole(req, ["SUPER"]);
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const { name, description } = body as { name?: string; description?: string };

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "name is required" },
        { status: 400 }
      );
    }

    const org = await createOrganization({ name: name.trim(), description: description?.trim() });
    return NextResponse.json({ ok: true, data: org }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
