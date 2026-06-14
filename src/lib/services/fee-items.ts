/**
 * 비용 항목 — 내부(운영) 관리용. 공개 페이지에는 노출하지 않음.
 */

import { prisma } from "@/lib/prisma/client";

export const FEE_CATEGORY_LABELS: Record<string, string> = {
  VISA_STAY: "비자/체류",
  ADMIN_APPEAL: "행정심판",
  CONTRACT_INVESTIGATION: "계약서/사실조사",
  LICENSE_PERMIT: "인허가",
  ETC: "기타"
};

export async function listFeeItems() {
  try {
    return await prisma.feeItem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
    });
  } catch {
    return [];
  }
}
