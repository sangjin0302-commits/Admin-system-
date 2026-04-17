import { NextResponse } from "next/server";

import {
  getInquiryById,
  persistLawbotSnapshot
} from "@/lib/services/inquiry-service";
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

  if (result.status === "available") {
    const data = result.data;

    await persistLawbotSnapshot({
      inquiryId: inquiry.id,
      status: data.practical_use_status ?? data.confidence_label ?? "available",
      summary:
        data.client_ready_summary?.[0] ??
        data.practitioner_brief?.[0] ??
        data.input_summary,
      payload: {
        input_summary: data.input_summary,
        practical_use_status: data.practical_use_status,
        confidence_score: data.confidence_score,
        confidence_label: data.confidence_label,
        match_reason: data.match_reason,
        research_goal: data.research_goal,
        review_required_reasons: data.review_required_reasons,
        critical_missing_facts: data.critical_missing_facts,
        priority_actions: data.priority_actions,
        risk_flags: data.risk_flags,
        practical_checklist: data.practical_checklist,
        document_checklist: data.document_checklist
      }
    });
  }

  return NextResponse.json({ result });
}
