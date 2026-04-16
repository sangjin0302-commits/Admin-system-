import { NextResponse } from "next/server";

import { getInquiryById } from "@/lib/services/inquiry-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const inquiry = await getInquiryById(id);

  if (!inquiry) {
    return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });
  }

  const result = await getLawbotCaseAnalysis(inquiry);
  return NextResponse.json({ result });
}
