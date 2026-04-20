import type { Prisma } from "@generated/prisma-client/client";

function pad(value: number, width: number) {
  return String(value).padStart(width, "0");
}

function formatDatePart(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}`;
}

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function sanitizeMatterTypeSegment(matterType: string) {
  const cleaned = matterType.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!cleaned) return "GENERAL";
  return cleaned.slice(0, 8);
}

export function buildCaseMatterNumberPrefix(date: Date, matterType: string) {
  return `${formatDatePart(date)}-${sanitizeMatterTypeSegment(matterType)}`;
}

export async function generateCaseMatterNumberTx(
  tx: Prisma.TransactionClient,
  matterType: string,
  now = new Date()
) {
  const { start, end } = dayRange(now);
  const prefix = buildCaseMatterNumberPrefix(now, matterType);

  const todayCount = await tx.caseMatter.count({
    where: {
      createdAt: {
        gte: start,
        lte: end
      },
      caseNo: {
        startsWith: `${prefix}-`
      }
    }
  });

  return `${prefix}-${pad(todayCount + 1, 3)}`;
}
