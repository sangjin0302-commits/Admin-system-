import { handleGetLawbotReviewFlowRequest } from "@/lib/services/lawbot-bridge-review-flow-action";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return handleGetLawbotReviewFlowRequest(id);
}
