import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { InquiryStatusGuardError, updateInquiryAdminFields } from "@/lib/services/inquiry-service";
import { updateInquiryAdminSchema } from "@/lib/validation/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const payload = updateInquiryAdminSchema.parse(await request.json());
    const inquiry = await updateInquiryAdminFields(id, payload);
    return NextResponse.json({ inquiry });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    if (error instanceof InquiryStatusGuardError) {
      return NextResponse.json(
        { error: error.message, blockers: error.blockers },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "문의 정보를 수정하지 못했습니다." }, { status: 400 });
  }
}
