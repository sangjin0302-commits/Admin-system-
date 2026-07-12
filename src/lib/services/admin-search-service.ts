import { prisma } from "@/lib/prisma/client";

export async function searchInquiries(query: string, limit = 20) {
  if (!query || query.length < 2) return [];
  return prisma.inquiry.findMany({
    where: {
      OR: [
        { contactName: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
        { description: { contains: query } },
      ],
    },
    select: { id: true, contactName: true, email: true, phone: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
