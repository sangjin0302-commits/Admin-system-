import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { generateAutoReplyDraft } from "@/lib/services/ai-auto-reply-service";

export async function POST(request: Request) {
  try {
    const { inquiryId } = await request.json();

    if (!inquiryId) {
      return NextResponse.json({ error: "inquiryId 필요" }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: {
        contactName: true,
        inquiryType: true,
        description: true,
        title: true,
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "문의를 찾을 수 없습니다" }, { status: 404 });
    }

    const draft = await generateAutoReplyDraft({
      name: inquiry.contactName,
      inquiryType: inquiry.inquiryType,
      message: inquiry.description,
      title: inquiry.title,
    });

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("Auto-reply draft error:", err);
    return NextResponse.json({ error: "초안 생성 실패" }, { status: 500 });
  }
}
