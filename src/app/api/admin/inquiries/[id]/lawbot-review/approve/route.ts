import { handleApproveLawbotReviewRequest } from "@/lib/services/lawbot-bridge-review-approval-action";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return handleApproveLawbotReviewRequest(request, id);
}
