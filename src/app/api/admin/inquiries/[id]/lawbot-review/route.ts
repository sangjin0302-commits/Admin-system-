import { handleGetLawbotReviewFlowRequest } from "@/lib/services/lawbot-bridge-review-flow-action";
import {
  buildSafeLawbotReviewDto,
  type LawbotReviewFlowResult
} from "@/lib/services/lawbot-bridge-review-flow-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const response = await handleGetLawbotReviewFlowRequest(id);

  if (response.status !== 200) {
    return response;
  }

  const payload = (await response.json()) as { result?: LawbotReviewFlowResult | null };
  return Response.json(
    { result: payload.result ? buildSafeLawbotReviewDto(payload.result) : null },
    { status: 200 }
  );
}
