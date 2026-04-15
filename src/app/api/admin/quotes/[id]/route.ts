import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createAuditLog } from "@/lib/audit/service";
import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import {
  recalculateQuoteDraft,
  saveQuoteManualEdits,
  transitionQuoteStatus,
  updateContractPaymentAutomation
} from "@/lib/services/quote-service";
import {
  recalculateQuoteSchema,
  saveQuoteManualEditsSchema,
  updateContractPaymentAutomationSchema,
  updateQuoteStatusSchema
} from "@/lib/validation/quote";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const requiredRole = body?.mode === "status" ? "ADMIN" : "STAFF";
    const session = await requireAdminApiSession(requiredRole);

    if (body?.mode === "manual") {
      const payload = saveQuoteManualEditsSchema.parse(body);
      const quote = await saveQuoteManualEdits(id, payload);
      return NextResponse.json({ quote });
    }

    if (body?.mode === "status") {
      const payload = updateQuoteStatusSchema.parse(body);
      const quote = await transitionQuoteStatus(id, {
        status: payload.status,
        caseDueDate: payload.caseDueDate ? new Date(payload.caseDueDate) : undefined,
        caseInternalMemo: payload.caseInternalMemo
      });
      await createAuditLog(prisma, {
        actor: {
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        actionType: "QUOTE_STATUS_UPDATED",
        entityType: "QUOTE",
        entityId: quote.id,
        summary: `견적 상태를 ${payload.status}로 변경`
      });
      return NextResponse.json({ quote });
    }

    if (body?.mode === "contractPayment") {
      const payload = updateContractPaymentAutomationSchema.parse(body);
      const quote = await updateContractPaymentAutomation(id, payload);
      return NextResponse.json({ quote });
    }

    const payload = recalculateQuoteSchema.parse(body);
    const quote = await recalculateQuoteDraft(id, payload);
    return NextResponse.json({ quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation error" },
        { status: 400 }
      );
    }

    return authErrorResponse(error, "Failed to update quote.");
  }
}
