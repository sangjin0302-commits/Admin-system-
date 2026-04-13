import { NextResponse } from "next/server";

import { getSubmissionWorkspace } from "@/lib/services/submission-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const submissionWorkspace = await getSubmissionWorkspace(id);
    return NextResponse.json({ submissionWorkspace });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load submission workspace." },
      { status: 400 }
    );
  }
}
