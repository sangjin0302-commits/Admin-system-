import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const api = createAdminRequestContext("admin.orgs.list");
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        subdomain: true,
        ownerEmail: true,
        plan: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return api.ok({ ok: true as const, orgs });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Org 목록을 불러오지 못했습니다.", { code: "LIST_FAILED" });
  }
}

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.orgs.create");
  const parsed = await safeReadJsonBody(request);
  if (!parsed.ok) return api.error(400, "요청 본문이 올바르지 않습니다.", { code: "INVALID_BODY" });

  const body = parsed.body as {
    name?: string;
    subdomain?: string;
    ownerEmail?: string;
    plan?: "FREE" | "PRO" | "ENTERPRISE";
    brandColor?: string;
    logoUrl?: string;
    contactPhone?: string;
    addressLine?: string;
  };

  if (!body.name || !body.subdomain || !body.ownerEmail) {
    return api.error(400, "name, subdomain, ownerEmail은 필수입니다.", { code: "MISSING_FIELDS" });
  }

  try {
    const created = await prisma.organization.create({
      data: {
        name: body.name,
        subdomain: body.subdomain,
        ownerEmail: body.ownerEmail,
        plan: body.plan ?? "PRO",
        brandColor: body.brandColor ?? null,
        logoUrl: body.logoUrl ?? null,
        contactPhone: body.contactPhone ?? null,
        addressLine: body.addressLine ?? null
      }
    });
    return api.ok({ ok: true as const, org: created }, { status: 201 });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Org 생성에 실패했습니다. subdomain 중복 여부를 확인하세요.", { code: "CREATE_FAILED" });
  }
}
