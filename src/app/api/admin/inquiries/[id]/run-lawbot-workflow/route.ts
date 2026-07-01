import { handleRunLawbotWorkflowRequest } from "@/lib/services/lawbot-bridge-case-workflow-action";

export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return handleRunLawbotWorkflowRequest(request, id);
}
