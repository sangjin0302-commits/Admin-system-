import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import {
  getInquiryById,
  persistLawbotSnapshot
} from "@/lib/services/inquiry-service";
import { getLawbotCaseAnalysis } from "@/lib/services/lawbot-case-analysis-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.lawbot_analysis.get");

  try {
    const { id: rawId } = await context.params;
    const id = normalizeAdminEntityId(rawId);
    if (!id) {
      return api.error(
        400,
        "\uBB38\uC758 ID \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        { code: "INVALID_INQUIRY_ID" }
      );
    }

    const inquiry = await getInquiryById(id);
    if (!inquiry) {
      return api.error(
        404,
        "\uBB38\uC758\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
        { code: "INQUIRY_NOT_FOUND" }
      );
    }

    const result = await getLawbotCaseAnalysis(inquiry, { trigger: "manual" });

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

    return api.ok({ ok: true, result });
  } catch (error) {
    api.logError(error);
    return api.error(
      500,
      "Lawbot \uBD84\uC11D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
      { code: "GET_LAWBOT_ANALYSIS_FAILED" }
    );
  }
}
