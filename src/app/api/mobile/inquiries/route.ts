import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const take = 20;
  const skip = (page - 1) * take;

  try {
    const inquiries = await prisma.inquiry.findMany({
      take,
      skip,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        contactName: true,
        title: true,
        status: true,
        inquiryType: true,
        urgencyLevel: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: inquiries,
      page,
      take,
    });
  } catch (error) {
    console.error("[mobile/inquiries] list failed", error);
    return NextResponse.json({ success: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
