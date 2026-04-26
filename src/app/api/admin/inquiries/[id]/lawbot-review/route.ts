import { handleGetLawbotReviewFlowRequest } from "@/lib/services/lawbot-bridge-review-flow-action";
import { sanitizeBridgeReviewOutput } from "@/lib/services/lawbot-bridge-text-normalizer";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const response = await handleGetLawbotReviewFlowRequest(id);

  if (response.status !== 200) {
    return response;
  }

  const payload = (await response.json()) as { result?: unknown };
  return Response.json(
    { result: sanitizeBridgeReviewOutput(payload.result ?? null) },
    { status: 200 }
  );
}
