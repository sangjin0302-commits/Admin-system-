import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { appendInquiryCommunicationLog } from "@/lib/services/inquiry-service";
import { appendInquiryCommunicationLogSchema } from "@/lib/validation/admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const payload = appendInquiryCommunicationLogSchema.parse(await request.json());
    const inquiry = await appendInquiryCommunicationLog(id, payload);
    return NextResponse.json({ inquiry });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "커뮤니케이션 로그를 저장하지 못했습니다." }, { status: 400 });
  }
}
