import { prisma } from "@/lib/prisma/client";

function pad(value: number, width: number) {
  return String(value).padStart(width, "0");
}

function formatDatePart(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}${pad(m, 2)}${pad(d, 2)}`;
}

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function generateCaseNumber(now = new Date()) {
  const { start, end } = dayRange(now);
  const datePart = formatDatePart(now);
  const todayCount = await prisma.caseRecord.count({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    }
  });

  return `CASE-${datePart}-${pad(todayCount + 1, 3)}`;
}
