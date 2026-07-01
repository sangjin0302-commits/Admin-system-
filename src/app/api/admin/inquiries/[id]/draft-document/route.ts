import { NextResponse } from "next/server";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { getInquiryById } from "@/lib/services/inquiry-service-read-helpers";
import {
  createLawbotBridgeHttpClientFromEnv,
  LawbotBridgeError
} from "@/lib/services/lawbot-bridge-http-client";

type DraftKind = "opinion" | "appeal" | "objection" | "petition";
const ALLOWED_DRAFT_KINDS: DraftKind[] = ["opinion", "appeal", "objection", "petition"];

function buildFactInputFromInquiry(inquiry: {
  title: string | null;
  description: string | null;
  generatedSummary: string | null;
  contactName?: string | null;
  nationality?: string | null;
  currentStatus?: string | null;
  targetAgency?: string | null;
  requestedOutcome?: string | null;
  recommendedNextStep?: string | null;
}) {
  const parts: string[] = [];
  if (inquiry.title) parts.push(`Case title: ${inquiry.title}`);
  if (inquiry.contactName) parts.push(`Client: ${inquiry.contactName}`);
  if (inquiry.nationality) parts.push(`Nationality: ${inquiry.nationality}`);
  if (inquiry.currentStatus) parts.push(`Current status: ${inquiry.currentStatus}`);
  if (inquiry.targetAgency) parts.push(`Agency: ${inquiry.targetAgency}`);
  if (inquiry.requestedOutcome) parts.push(`Requested outcome: ${inquiry.requestedOutcome}`);
  if (inquiry.generatedSummary) parts.push(`Existing summary: ${inquiry.generatedSummary}`);
  if (inquiry.description) parts.push(`Inquiry details: ${inquiry.description}`);
  if (inquiry.recommendedNextStep)
    parts.push(`Recommended next step: ${inquiry.recommendedNextStep}`);
  return parts.filter(Boolean).join("\n");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.draft_document.post");

  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) {
    return api.error(400, "문의 ID 형식이 올바르지 않습니다.", { code: "INVALID_INQUIRY_ID" });
  }

  const bodyResult = await safeReadJsonBody(request);
  if (!bodyResult.ok) {
    return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  }
  const body = (bodyResult.body ?? {}) as { draftKind?: string; extraContext?: string };
  const draftKind = (body.draftKind ?? "").trim() as DraftKind;
  if (!ALLOWED_DRAFT_KINDS.includes(draftKind)) {
    return api.error(400, "지원하지 않는 서면 종류입니다.", { code: "INVALID_DRAFT_KIND" });
  }
  const extraContext = typeof body.extraContext === "string" ? body.extraContext.trim() : "";

  try {
    const inquiry = await getInquiryById(id);
    if (!inquiry) {
      return api.error(404, "문의를 찾을 수 없습니다.", { code: "INQUIRY_NOT_FOUND" });
    }

    const baseFact = buildFactInputFromInquiry(inquiry as never);
    const factInput = extraContext ? `${baseFact}\n\n[추가 사실관계]\n${extraContext}` : baseFact;

    if (factInput.trim().length < 10) {
      return api.error(400, "사안 내용이 부족하여 초안을 생성할 수 없습니다.", {
        code: "FACT_INPUT_TOO_SHORT"
      });
    }

    const client = createLawbotBridgeHttpClientFromEnv();
    const requestId = `admin-draft-doc-${id}-${Date.now()}`;
    const response = await client.createDocumentDraft({
      requestId,
      draftKind,
      factInput,
      options: { includeTraceability: true }
    });

    const draftBlob = (response.draft ?? {}) as Record<string, unknown>;
    const draftText =
      (draftBlob.draft_text as string | undefined) ??
      (draftBlob.text as string | undefined) ??
      (draftBlob.content as string | undefined) ??
      null;
    const sections = (draftBlob.sections as unknown) ?? null;
    const warnings = (response.must_verify ?? []).concat(response.risk_flags ?? []);

    return NextResponse.json({
      ok: true,
      draft: draftText,
      sections,
      warnings,
      draftKind,
      raw: response.draft ?? null,
      requestId
    });
  } catch (error) {
    if (error instanceof LawbotBridgeError) {
      api.logError(error);
      return api.error(
        503,
        "lawbot 브릿지 오류. 환경변수(LAWBOT_BRIDGE_BASE_URL 등) 설정을 확인하세요.",
        { code: "LAWBOT_BRIDGE_ERROR" }
      );
    }
    if (error instanceof Error && error.message.includes("required")) {
      return api.error(
        503,
        "lawbot 연동이 설정되지 않았습니다 (LAWBOT_BRIDGE_BASE_URL / LAWBOT_SERVICE_KEY / LAWBOT_SERVICE_CALLER).",
        { code: "LAWBOT_BRIDGE_NOT_CONFIGURED" }
      );
    }
    api.logError(error);
    return api.error(500, "AI 서면 초안 생성에 실패했습니다.", {
      code: "DRAFT_DOCUMENT_FAILED"
    });
  }
}
