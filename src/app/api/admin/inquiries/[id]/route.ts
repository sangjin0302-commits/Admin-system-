import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { updateInquiryAdminSchema } from "@/lib/validation/admin";
import { updateInquiryAdminFields } from "@/lib/services/inquiry-service";

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
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to update inquiry." }, { status: 400 });
  }
}
