import { prisma } from "@/lib/prisma/client";
import type { InquiryType } from "@/types/inquiry";

const inquiryTypeCodeMap: Record<InquiryType, string> = {
  FOREIGNER_VISA: "VISA",
  IMMIGRATION_STAY: "STAY",
  APOSTILLE_CONSULAR: "APOS",
  TRANSLATION_NOTARY: "TRAN",
  GENERAL_ADMIN_CIVIL: "ADMIN",
  CORPORATE_REQUEST: "CORP",
  UNKNOWN: "GEN"
};

function formatDateInKst(date: Date) {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

  return formatted.replaceAll("-", "");
}

function getYearRangeInKst(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .format(date)
    .split("-");

  const year = Number(parts[0]);
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    end: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0))
  };
}

export async function getInquiryReceiptCode(input: {
  id: string;
  createdAt: Date;
  inquiryType: InquiryType;
}) {
  const { start, end } = getYearRangeInKst(input.createdAt);
  const sequence = await prisma.inquiry.count({
    where: {
      inquiryType: input.inquiryType,
      createdAt: {
        gte: start,
        lt: end,
        lte: input.createdAt
      }
    }
  });

  return `${formatDateInKst(input.createdAt)}-${inquiryTypeCodeMap[input.inquiryType]}-${String(sequence).padStart(4, "0")}`;
}
