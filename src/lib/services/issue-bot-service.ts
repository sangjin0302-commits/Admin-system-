import { prisma } from "@/lib/prisma/client";
import { getIssueBotLabel } from "@/lib/issue-bots/catalog";

export async function listIssueBotLinks(inquiryId: string) {
  return prisma.issueBotLink.findMany({
    where: { inquiryId },
    orderBy: [{ createdAt: "asc" }]
  });
}

export async function saveIssueBotLink(input: {
  inquiryId: string;
  botKey: string;
  connectionNotes?: string;
  externalThreadId?: string;
}) {
  const botLabel = getIssueBotLabel(input.botKey);

  return prisma.issueBotLink.upsert({
    where: {
      inquiryId_botKey: {
        inquiryId: input.inquiryId,
        botKey: input.botKey
      }
    },
    update: {
      botLabel,
      status: "PLANNED",
      connectionNotes: input.connectionNotes?.trim() || null,
      externalThreadId: input.externalThreadId?.trim() || null
    },
    create: {
      inquiryId: input.inquiryId,
      botKey: input.botKey,
      botLabel,
      status: "PLANNED",
      connectionNotes: input.connectionNotes?.trim() || null,
      externalThreadId: input.externalThreadId?.trim() || null
    }
  });
}
