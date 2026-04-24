import {
  getLawbotBridgeReviewFlowByInquiryId,
  type LawbotReviewFlowResult
} from "./lawbot-bridge-review-flow-service.ts";

export type LawbotReviewFlowLoader = (
  inquiryId: string
) => Promise<LawbotReviewFlowResult | null>;

export async function handleGetLawbotReviewFlowRequest(
  inquiryId: string,
  dependencies?: {
    loadReviewFlow?: LawbotReviewFlowLoader;
  }
) {
  try {
    const loadReviewFlow =
      dependencies?.loadReviewFlow ?? getLawbotBridgeReviewFlowByInquiryId;

    const result = await loadReviewFlow(inquiryId);
    if (!result) {
      return Response.json({ error: "Inquiry not found." }, { status: 404 });
    }

    return Response.json({ result }, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load lawbot review flow."
      },
      { status: 500 }
    );
  }
}
