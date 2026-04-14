import { NextResponse } from "next/server";
import { z } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
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
    const session = await requireAdminApiSession("ADMIN");
    const payload = updateStatusSchema.parse(await request.json());
    const inquiry = await updateInquiryAdminFields(id, { status: payload.status });
    await createAuditLog(prisma, {
      actor: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      },
      actionType: "INQUIRY_STATUS_UPDATED",
      entityType: "INQUIRY",
      entityId: inquiry.id,
      summary: `문의 상태를 ${payload.status}로 변경`
    });

    return NextResponse.json({ inquiry });
  } catch (error) {
    return authErrorResponse(error, "Failed to update inquiry status.");
  }
}
