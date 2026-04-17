import { NextResponse } from "next/server";
import { z } from "zod";

import { updateInquiryAdminFields } from "@/lib/services/inquiry-service";
import { inquiryStatusValues } from "@/types/inquiry";

const updateStatusSchema = z.object({
  status: z.enum(inquiryStatusValues)
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const payload = updateStatusSchema.parse(await request.json());
    const inquiry = await updateInquiryAdminFields(id, { status: payload.status });

    return NextResponse.json({ inquiry });
  } catch {
    return NextResponse.json({ error: "Failed to update inquiry status." }, { status: 400 });
  }
}
