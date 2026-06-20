export { GET, POST } from "./route-safe-v3";
/*
import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { createInquiry } from "@/lib/services/inquiry-service";
import { logger } from "@/lib/utils/logger";

async function POST_LEGACY_UNUSED(request: Request) {
  try {
    const payload = await request.json();
    const inquiry = await createInquiry(payload);

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "\uC785\uB825 \uAC12\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694." },
        { status: 400 }
      );
    }

    logger.error("Failed to create inquiry", error);
    return NextResponse.json(
      {
        error:
          "\uBB38\uC758 \uC811\uC218\uB97C \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
      },
      { status: 500 }
    );

    //
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "입력값을 다시 확인해 주세요." },
        { status: 400 }
      );
    }

    logger.error("Failed to create inquiry", error);
    return NextResponse.json(
      { error: "문의 접수를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
    //
  }
}
*/
