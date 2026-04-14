import type { Prisma, PrismaClient } from "@generated/prisma-client/client";
import type { InquiryType } from "@/types/inquiry";

import { getDefaultCaseDocumentTemplates } from "@/lib/case-documents/templates";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function ensureCaseDocumentChecklist(
  db: DbClient,
  caseId: string,
  inquiryType: InquiryType
) {
  const templates = getDefaultCaseDocumentTemplates(inquiryType);

  const existing = await db.caseDocumentItem.findMany({
    where: { caseId },
    select: { documentType: true }
  });

  const existingTypes = new Set(existing.map((item) => item.documentType));
  const missing = templates
    .filter((template) => !existingTypes.has(template.documentType))
    .map((template) => ({
      caseId,
      documentType: template.documentType,
      label: template.label,
      isRequired: template.isRequired,
      isReceived: false,
      sortOrder: template.sortOrder
    }));

  if (missing.length === 0) {
    return;
  }

  await db.caseDocumentItem.createMany({
    data: missing
  });
}
