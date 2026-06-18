import { prisma } from "@/lib/prisma/client";

export async function getOverdueInquiries(daysSinceLastContact = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysSinceLastContact);

  const inquiries = await prisma.inquiry.findMany({
    where: {
      status: { in: ["NEW", "PRE_DIAGNOSED", "CONSULTATION_REQUIRED", "QUOTE_PENDING", "IN_REVIEW"] },
      updatedAt: { lt: cutoff },
    },
    orderBy: { updatedAt: "asc" },
    take: 50,
  });

  return inquiries.map((inq) => ({
    id: inq.id,
    name: inq.contactName,
    email: inq.email,
    phone: inq.phone,
    status: inq.status,
    inquiryType: inq.inquiryType,
    title: inq.title,
    daysSinceUpdate: Math.floor((Date.now() - inq.updatedAt.getTime()) / 86400000),
    updatedAt: inq.updatedAt,
  }));
}

export async function getOverdueCases(daysSinceLastUpdate = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysSinceLastUpdate);

  const cases = await prisma.caseMatter.findMany({
    where: {
      status: {
        notIn: ["CLOSED", "CANCELLED"],
      },
      updatedAt: { lt: cutoff },
    },
    orderBy: { updatedAt: "asc" },
    take: 50,
    include: {
      parties: { where: { role: "CLIENT" }, take: 1 },
    },
  });

  return cases.map((c) => ({
    id: c.id,
    title: c.title,
    caseNo: c.caseNo,
    status: c.status,
    clientName: c.parties[0]?.name ?? "미지정",
    clientEmail: c.parties[0]?.email ?? null,
    daysSinceUpdate: Math.floor((Date.now() - c.updatedAt.getTime()) / 86400000),
    updatedAt: c.updatedAt,
  }));
}
