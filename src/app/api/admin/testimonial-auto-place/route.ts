import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// canonical(legacy) 서비스 URL 사용 — visa/corporation 은 redirect 대상이라 immigration/corporate 로.
const SERVICE_CATEGORIES: Record<string, string> = {
  VISA_STAY: "/services/immigration",
  ADMIN_APPEAL: "/services/appeal",
  CONTRACT_INVESTIGATION: "/services/contract",
  LICENSE_PERMIT: "/services/license",
  CORP_FORMATION: "/services/corporate",
};

export async function GET() {
  const api = createAdminRequestContext("admin.testimonial-auto-place");
  if (!(await isFeatureEnabled("testimonial_auto_placement"))) {
    return api.error(403, "후기 자동 배치 비활성", { code: "FEATURE_DISABLED" });
  }
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });

    const mapping = testimonials.map((t) => ({
      testimonialId: t.id,
      serviceCategory: t.category,
      suggested_page: SERVICE_CATEGORIES[t.category] ?? "/services",
      author: t.author,
      quote: t.quote.slice(0, 80),
    }));

    return api.ok({ ok: true, mapping });
  } catch (err) {
    api.logError(err);
    return api.error(500, "후기 매칭 실패", { code: "MATCH_FAILED" });
  }
}

export async function POST(req: Request) {
  const api = createAdminRequestContext("admin.testimonial-auto-place");
  if (!(await isFeatureEnabled("testimonial_auto_placement"))) {
    return api.error(403, "후기 자동 배치 비활성", { code: "FEATURE_DISABLED" });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as {
      placements?: { testimonialId: string; page: string }[];
    };
    if (!body.placements?.length) {
      return api.error(400, "placements 배열 필수", { code: "INVALID_INPUT" });
    }

    await prisma.siteSetting.upsert({
      where: { key: "testimonial_placements" },
      update: {
        value: JSON.stringify(body.placements),
        updatedBy: "admin",
      },
      create: {
        key: "testimonial_placements",
        value: JSON.stringify(body.placements),
        updatedBy: "admin",
      },
    });

    return api.ok({ ok: true, saved: body.placements.length });
  } catch (err) {
    api.logError(err);
    return api.error(500, "배치 저장 실패", { code: "SAVE_FAILED" });
  }
}
