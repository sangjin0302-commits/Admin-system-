/**
 * OO3: 문의 → 견적 계산기 자동 프리셋.
 *
 * GET /api/admin/inquiries/{id}/quote-preset
 * Returns: { category: string, discount: string }
 *
 * inquiryType + 재의뢰 여부로 매핑:
 *   FOREIGNER_VISA · IMMIGRATION_STAY → LICENSE_PERMIT
 *   APOSTILLE_CONSULAR · TRANSLATION_NOTARY → CONTRACT
 *   GENERAL_ADMIN_CIVIL → ADMIN_APPEAL
 *   CORPORATE_REQUEST → ADVISORY
 *   같은 email WON 이력 있으면 discount=repeat
 *
 * Feature flag: `quote_calculator`
 */

import { prisma } from "@/lib/prisma/client";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { InquiryStatus } from "@generated/prisma-client/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TYPE_TO_CATEGORY: Record<string, string> = {
  FOREIGNER_VISA: "LICENSE_PERMIT",
  IMMIGRATION_STAY: "LICENSE_PERMIT",
  APOSTILLE_CONSULAR: "CONTRACT",
  TRANSLATION_NOTARY: "CONTRACT",
  GENERAL_ADMIN_CIVIL: "ADMIN_APPEAL",
  CORPORATE_REQUEST: "ADVISORY",
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.inquiry.quote-preset");
  if (!(await isFeatureEnabled("quote_calculator"))) {
    return api.error(403, "견적 계산기가 비활성화되어 있습니다.", { code: "FEATURE_DISABLED" });
  }
  try {
    const { id } = await ctx.params;
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: { id: true, email: true, inquiryType: true, requestedInquiryType: true },
    });
    if (!inquiry) return api.error(404, "문의 없음", { code: "NOT_FOUND" });

    const primaryType = inquiry.requestedInquiryType ?? inquiry.inquiryType;
    const category = TYPE_TO_CATEGORY[primaryType] ?? "ADMIN_APPEAL";

    let discount = "none";
    if (inquiry.email) {
      const wonCount = await prisma.inquiry
        .count({ where: { email: inquiry.email, status: InquiryStatus.WON, NOT: { id } } })
        .catch(() => 0);
      if (wonCount >= 1) discount = "repeat";
    }

    return api.ok({ category, discount, sourceType: primaryType });
  } catch (err) {
    api.logError(err);
    return api.error(500, "프리셋 계산 실패", { code: "PRESET_FAILED" });
  }
}
