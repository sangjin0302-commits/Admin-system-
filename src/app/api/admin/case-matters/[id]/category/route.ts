import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { seedCategoryRequiredDocuments } from "@/lib/services/category-required-documents";
import { PRACTICE_AREA_KEYS } from "@/lib/practice-areas";

const VALID_CATEGORIES = [...PRACTICE_AREA_KEYS, "OTHER"] as const;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.case-matters.category.patch");
  const { id: rawCaseMatterId } = await context.params;
  const caseMatterId = normalizeAdminEntityId(rawCaseMatterId);

  if (!caseMatterId) {
    return api.error(400, "Invalid case matter id format.", { code: "INVALID_CASE_MATTER_ID" });
  }

  const bodyResult = await safeReadJsonBody(request);
  if (!bodyResult.ok) {
    return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
  }

  const body = bodyResult.body as Record<string, unknown>;
  const category = body.category;

  if (typeof category !== "string" || !VALID_CATEGORIES.includes(category as never)) {
    return api.error(400, "Invalid category value.", { code: "INVALID_CATEGORY" });
  }

  try {
    const existing = await prisma.caseMatter.findUnique({
      where: { id: caseMatterId },
      select: { id: true }
    });

    if (!existing) {
      return api.error(404, "Case matter not found.", { code: "CASE_MATTER_NOT_FOUND" });
    }

    await prisma.caseMatter.update({
      where: { id: caseMatterId },
      data: { category: category as never }
    });

    // 카테고리 변경 시 해당 카테고리 기본 체크리스트 자동 시드
    const seed = await seedCategoryRequiredDocuments(caseMatterId, category);

    return api.ok({ ok: true, category, seededRequiredDocuments: seed });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Failed to update category.", { code: "PATCH_CATEGORY_FAILED" });
  }
}
