import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { generateAutoReplyDraft } from "@/lib/services/ai-auto-reply-service";
import { withJsonHandler } from "@/lib/utils/api-handler";

type AutoReplyBody = { inquiryId?: string };

export const POST = withJsonHandler<AutoReplyBody>(
  async (body) => {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: body.inquiryId! },
      select: {
        contactName: true,
        inquiryType: true,
        description: true,
        title: true
      }
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "문의를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const draft = await generateAutoReplyDraft({
      name: inquiry.contactName,
      inquiryType: inquiry.inquiryType,
      message: inquiry.description,
      title: inquiry.title
    });

    return { draft };
  },
  {
    logScope: "admin/auto-reply",
    errorMessage: "초안 생성 실패",
    validate: (body) => (body && body.inquiryId ? null : "inquiryId 필요")
  }
);
