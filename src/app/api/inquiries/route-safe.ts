import { ZodError } from "zod";
import { NextResponse } from "next/server";

import { createInquiry } from "@/lib/services/inquiry-service";

const KO_BAD_REQUEST_DEFAULT = "\uC785\uB825 \uAC12\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694.";
const KO_INTERNAL_ERROR =
  "\uBB38\uC758 \uC811\uC218\uB97C \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const inquiry = await createInquiry(payload);

    return NextResponse.json({ inquiry }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? KO_BAD_REQUEST_DEFAULT }, { status: 400 });
    }

    console.error("Failed to create inquiry", error);
    return NextResponse.json({ error: KO_INTERNAL_ERROR }, { status: 500 });
  }
}
