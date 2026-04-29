import { ZodError, z } from "zod";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";

import {
  LawbotReviewApprovalError,
  approveLawbotReview
} from "./lawbot-bridge-review-approval-service";

const requiredApprovalCheck = (label: string) =>
  z.boolean().refine((value) => value === true, {
    message: `${label} confirmation is required.`
  });

const approvalRequestSchema = z.strictObject({
  manualReviewChecked: requiredApprovalCheck("Manual review"),
  sourcesChecked: requiredApprovalCheck("Source review"),
  riskFlagsChecked: requiredApprovalCheck("Risk flag review"),
  draftsReviewed: requiredApprovalCheck("Draft review"),
  operatorNote: z.string().trim().max(1000).nullable().optional(),
  expectedWorkflowStatus: z.literal("APPROVAL_PENDING").optional().default("APPROVAL_PENDING")
});

export type ApproveLawbotReviewHandlerDependencies = {
  approve?: typeof approveLawbotReview;
};

export async function handleApproveLawbotReviewRequest(
  request: Request,
  rawInquiryId: string,
  dependencies: ApproveLawbotReviewHandlerDependencies = {}
) {
  const api = createAdminRequestContext("admin.inquiries.lawbot-review.approve.post");
  const inquiryId = normalizeAdminEntityId(rawInquiryId);

  if (!inquiryId) {
    return api.error(400, "Invalid inquiry id.", {
      code: "INVALID_INQUIRY_ID"
    });
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    if (!bodyResult.ok) {
      return api.error(400, "Invalid JSON request body.", {
        code: "INVALID_JSON_BODY"
      });
    }

    const payload = approvalRequestSchema.parse(bodyResult.body);
    const approve = dependencies.approve ?? approveLawbotReview;
    const result = await approve({
      inquiryId,
      manualReviewChecked: payload.manualReviewChecked,
      sourcesChecked: payload.sourcesChecked,
      riskFlagsChecked: payload.riskFlagsChecked,
      draftsReviewed: payload.draftsReviewed,
      operatorNote: payload.operatorNote ?? null,
      expectedWorkflowStatus: payload.expectedWorkflowStatus
    });

    return api.ok({ ok: true, result });
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "Invalid approval request."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof LawbotReviewApprovalError) {
      return Response.json(
        {
          ok: false,
          error: error.message,
          requestId: api.requestId,
          code: error.code,
          reason: error.reason
        },
        {
          status: error.status,
          headers: {
            "Cache-Control": "no-store",
            "X-Admin-Request-Id": api.requestId
          }
        }
      );
    }

    api.logError(error);
    return api.error(500, "Lawbot review approval failed.", {
      code: "LAWBOT_REVIEW_APPROVAL_FAILED"
    });
  }
}
