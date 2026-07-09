import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { logger } from "@/lib/utils/logger";

const CATEGORY_MAP: Record<string, string> = {
  FOREIGNER_VISA: "VISA_STAY",
  IMMIGRATION_STAY: "VISA_STAY",
  APOSTILLE_CONSULAR: "OTHER",
  TRANSLATION_NOTARY: "OTHER",
  GENERAL_ADMIN_CIVIL: "ADMIN_APPEAL",
  CORPORATE_REQUEST: "CONTRACT_INVESTIGATION",
  UNKNOWN: "OTHER",
};

async function generateCaseNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ETHOS-${year}-`;
  const count = await prisma.caseMatter.count({
    where: { caseNo: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export async function autoCreateCaseFromInquiry(inquiryId: string) {
  const enabled = await isFeatureEnabled("quote_to_case_auto").catch(() => false);
  if (!enabled) return null;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: {
      id: true,
      title: true,
      contactName: true,
      inquiryType: true,
    },
  });

  if (!inquiry) {
    logger.warn("[quote-to-case] inquiry not found", { inquiryId });
    return null;
  }

  const existing = await prisma.caseMatter.findFirst({
    where: { inquiryId },
    select: { id: true },
  });

  if (existing) {
    logger.info("[quote-to-case] CaseMatter already exists", { inquiryId });
    return existing;
  }

  const caseNo = await generateCaseNo();
  const category = CATEGORY_MAP[inquiry.inquiryType] ?? "OTHER";

  const caseMatter = await prisma.caseMatter.create({
    data: {
      caseNo,
      title: inquiry.title,
      matterType: inquiry.inquiryType,
      category: category as never,
      status: "INTAKE_REVIEW" as never,
      inquiryId,
    },
  });

  logger.info("[quote-to-case] auto-created CaseMatter", {
    caseNo,
    inquiryId,
  });

  return caseMatter;
}
