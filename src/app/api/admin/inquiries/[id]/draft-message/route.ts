import { NextResponse } from "next/server";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { getInquiryById } from "@/lib/services/inquiry-service-read-helpers";
import {
  createLawbotBridgeHttpClientFromEnv,
  LawbotBridgeError
} from "@/lib/services/lawbot-bridge-http-client";

export const maxDuration = 30;

type MessageKind =
  | "status_update"
  | "quote_followup"
  | "consultation_confirmation"
  | "case_closed";
type Tone = "formal" | "warm" | "direct";

const ALLOWED_KINDS: MessageKind[] = [
  "status_update",
  "quote_followup",
  "consultation_confirmation",
  "case_closed"
];
const ALLOWED_TONES: Tone[] = ["formal", "warm", "direct"];

function buildFactInputFromInquiry(inquiry: {
  title: string | null;
  description: string | null;
  generatedSummary: string | null;
  contactName?: string | null;
  currentStatus?: string | null;
  targetAgency?: string | null;
  requestedOutcome?: string | null;
}) {
  const parts: string[] = [];
  if (inquiry.title) parts.push(`Case title: ${inquiry.title}`);
  if (inquiry.contactName) parts.push(`Client: ${inquiry.contactName}`);
  if (inquiry.currentStatus) parts.push(`Current status: ${inquiry.currentStatus}`);
  if (inquiry.targetAgency) parts.push(`Agency: ${inquiry.targetAgency}`);
  if (inquiry.requestedOutcome) parts.push(`Requested outcome: ${inquiry.requestedOutcome}`);
  if (inquiry.generatedSummary) parts.push(`Existing summary: ${inquiry.generatedSummary}`);
  if (inquiry.description) parts.push(`Inquiry details: ${inquiry.description}`);
  return parts.filter(Boolean).join("\n");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.draft_message.post");

  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) {
    return api.error(400, "문의 ID 형식이 올바르지 않습니다.", { code: "INVALID_INQUIRY_ID" });
  }

  const bodyResult = await safeReadJsonBody(request);
  if (!bodyResult.ok) {
    return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  }
  const body = (bodyResult.body ?? {}) as { messageKind?: string; tone?: string };
  const messageKind = (body.messageKind ?? "").trim() as MessageKind;
  const tone = (body.tone ?? "formal").trim() as Tone;
  if (!ALLOWED_KINDS.includes(messageKind)) {
    return api.error(400, "지원하지 않는 메시지 종류입니다.", { code: "INVALID_MESSAGE_KIND" });
  }
  if (!ALLOWED_TONES.includes(tone)) {
    return api.error(400, "지원하지 않는 톤입니다.", { code: "INVALID_TONE" });
  }

  try {
    const inquiry = await getInquiryById(id);
    if (!inquiry) {
      return api.error(404, "문의를 찾을 수 없습니다.", { code: "INQUIRY_NOT_FOUND" });
    }

    const factInput = buildFactInputFromInquiry(inquiry as never);
    if (factInput.trim().length < 10) {
      return api.error(400, "사안 내용이 부족하여 메시지를 생성할 수 없습니다.", {
        code: "FACT_INPUT_TOO_SHORT"
      });
    }

    const client = createLawbotBridgeHttpClientFromEnv();
    const requestId = `admin-draft-msg-${id}-${Date.now()}`;
    const response = await client.createCustomerMessageDraft({
      requestId,
      messageKind,
      tone,
      factInput
    });

    const draftBlob = (response.draft ?? {}) as Record<string, unknown>;
    const messageText =
      (draftBlob.message_text as string | undefined) ??
      (draftBlob.text as string | undefined) ??
      (draftBlob.body as string | undefined) ??
      null;
    const subject =
      (draftBlob.subject as string | undefined) ??
      (draftBlob.title as string | undefined) ??
      null;

    return NextResponse.json({
      ok: true,
      message: messageText,
      subject,
      warnings: response.risk_flags ?? [],
      messageKind,
      tone,
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
    return api.error(500, "AI 고객 메시지 초안 생성에 실패했습니다.", {
      code: "DRAFT_MESSAGE_FAILED"
    });
  }
}
