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
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create inquiry." }, { status: 500 });
  }
}
