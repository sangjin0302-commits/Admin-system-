import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { createInquiry } from "@/lib/services/inquiry-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const inquiry = await createInquiry(payload);

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    console.error("Failed to create inquiry", error);
    return NextResponse.json(
      { error: "문의 접수를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
