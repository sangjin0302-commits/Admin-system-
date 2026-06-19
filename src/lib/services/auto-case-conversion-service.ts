import { prisma } from "@/lib/prisma/client";

const URGENT_LEVELS = new Set(["HIGH", "CRITICAL"]);

export function shouldAutoConvert(inquiry: {
  status?: string;
  urgencyLevel?: string;
  qualificationScore?: number;
}): boolean {
  if (!inquiry) return false;
  if (inquiry.status === "WON") return true;
  if (
    inquiry.urgencyLevel &&
    URGENT_LEVELS.has(inquiry.urgencyLevel) &&
    (inquiry.qualificationScore ?? 0) >= 70
  ) {
    return true;
  }
  return false;
}

function mapMatterType(inquiryType: string | null | undefined): string {
  switch (inquiryType) {
    case "FOREIGNER_VISA":
      return "VISA";
    case "IMMIGRATION_STAY":
      return "IMMIGRATION";
    case "APOSTILLE_CONSULAR":
      return "APOSTILLE";
    case "TRANSLATION_NOTARY":
      return "TRANSLATION";
    case "GENERAL_ADMIN_CIVIL":
      return "ADMIN_CIVIL";
    case "CORPORATE_REQUEST":
      return "CORPORATE";
    default:
      return "GENERAL";
  }
}

function mapPriority(urgencyLevel: string | null | undefined): "LOW" | "NORMAL" | "HIGH" | "URGENT" {
  switch (urgencyLevel) {
    case "LOW":
      return "LOW";
    case "HIGH":
      return "HIGH";
    case "CRITICAL":
      return "URGENT";
    case "MEDIUM":
    default:
      return "NORMAL";
  }
}

export async function autoConvertInquiry(
  inquiryId: string
): Promise<{ caseId: string } | null> {
  const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
  if (!inquiry) return null;

  // Avoid double-conversion: if an existing case already links to this inquiry, skip.
  const existing = await prisma.caseMatter.findFirst({
    where: { inquiryId },
    select: { id: true },
  });
  if (existing) {
    return { caseId: existing.id };
  }

  const created = await prisma.caseMatter.create({
    data: {
      title: inquiry.title,
      matterType: mapMatterType(inquiry.inquiryType),
      status: "INTAKE_REVIEW",
      priority: mapPriority(inquiry.urgencyLevel),
      inquiryId: inquiry.id,
      summary: inquiry.description,
      openedAt: new Date(),
    },
    select: { id: true },
  });

  await prisma.caseEvent.create({
    data: {
      caseId: created.id,
      eventType: "auto_converted",
      message: "Inquiry auto-converted to case",
      payloadJson: JSON.stringify({ inquiryId }),
    },
  });

  return { caseId: created.id };
}

export async function scanAndConvertQualifyingInquiries(): Promise<{
  converted: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let converted = 0;

  const candidates = await prisma.inquiry.findMany({
    where: {
      OR: [
        { status: "WON" },
        {
          urgencyLevel: { in: ["HIGH", "CRITICAL"] },
          qualificationScore: { gte: 70 },
        },
      ],
      caseMatters: { none: {} },
    },
    select: {
      id: true,
      status: true,
      urgencyLevel: true,
      qualificationScore: true,
    },
    take: 100,
  });

  for (const inquiry of candidates) {
    if (!shouldAutoConvert(inquiry)) continue;
    try {
      const result = await autoConvertInquiry(inquiry.id);
      if (result) converted += 1;
    } catch (error) {
      errors.push(
        `${inquiry.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return { converted, errors };
}
