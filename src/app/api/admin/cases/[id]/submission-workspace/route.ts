import { NextResponse } from "next/server";

import { authErrorResponse } from "@/lib/auth/api";
import { requireAdminApiSession } from "@/lib/auth/session";
import { getSubmissionWorkspace } from "@/lib/services/submission-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await requireAdminApiSession("STAFF");
    const submissionWorkspace = await getSubmissionWorkspace(id);
    return NextResponse.json({ submissionWorkspace });
  } catch (error) {
    return authErrorResponse(error, "Failed to load submission workspace.");
  }
}
