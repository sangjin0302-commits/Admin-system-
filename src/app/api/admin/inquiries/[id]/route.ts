import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { updateInquiryAdminSchema } from "@/lib/validation/admin";
import { updateInquiryAdminFields } from "@/lib/services/inquiry-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await requireAdminApiSession("STAFF");
    const payload = updateInquiryAdminSchema.parse(await request.json());
    if (payload.status && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 부족합니다." }, { status: 403 });
    }
    const inquiry = await updateInquiryAdminFields(id, payload);
    return NextResponse.json({ inquiry });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to update inquiry.");
  }
}
