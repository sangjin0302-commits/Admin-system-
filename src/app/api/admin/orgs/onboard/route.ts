import { NextResponse } from "next/server";
import { requireRole } from "@/lib/services/admin-rbac-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { prisma } from "@/lib/prisma/client";
import { getCurrentOrgId } from "@/lib/services/org-context-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type OnboardInput = {
  name?: string;
  subdomain?: string;
  addressLine?: string;
  contactPhone?: string;
  adminEmail?: string;
  adminName?: string;
  plan?: "FREE" | "PRO" | "ENTERPRISE";
};

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  if (!(await isFeatureEnabled("org_onboarding_wizard"))) {
    return NextResponse.json({ error: "feature disabled" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as OnboardInput;

  const name = body.name?.trim();
  const subdomain = body.subdomain?.trim().toLowerCase();
  const adminEmail = body.adminEmail?.trim().toLowerCase();

  if (!name || !subdomain || !adminEmail) {
    return NextResponse.json(
      { error: "name, subdomain, adminEmail are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9-]{3,32}$/.test(subdomain)) {
    return NextResponse.json(
      { error: "subdomain must be 3-32 chars, [a-z0-9-]" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.organization.findUnique({ where: { subdomain } });
    if (existing) {
      return NextResponse.json({ error: "subdomain already taken" }, { status: 409 });
    }

    // Ensure org context resolves cleanly (multi_org_mode-aware).
    await getCurrentOrgId(req);

    const org = await prisma.organization.create({
    data: {
      name,
      subdomain,
      ownerEmail: adminEmail,
      plan: body.plan ?? "PRO",
      contactPhone: body.contactPhone?.trim() || null,
      addressLine: body.addressLine?.trim() || null,
      active: true,
    },
  });

  // organization-service 는 키 하나(`org.<id>`)에 JSON 값 하나를 기대한다.
  // 예전에는 `org.<id>.name` 같은 키 4개에 평문을 넣어서, 목록 조회가 그 4개를
  // 전부 JSON.parse 하려다 실패하고 조직을 통째로 누락시켰다(경고 로그만 쌓임).
  const settings: Array<{ key: string; value: string }> = [
    {
      key: `org.${org.id}`,
      value: JSON.stringify({
        name,
        description: body.addressLine?.trim() || "",
        adminEmail,
        adminName: body.adminName?.trim() || adminEmail,
        createdAt: new Date().toISOString(),
      }),
    },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value },
    });
  }

    return NextResponse.json({
      ok: true,
      organization: {
        id: org.id,
        name: org.name,
        subdomain: org.subdomain,
        plan: org.plan,
      },
    });
  } catch (error) {
    console.error("[admin/orgs/onboard] failed", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
