import { NextResponse } from "next/server";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { draftSupplementResponse } from "@/lib/services/supplement-response-bot";

export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.supplement_response.post");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) return api.error(400, "문의 ID 형식이 올바르지 않습니다.", { code: "INVALID_INQUIRY_ID" });

  const body = await safeReadJsonBody(request);
  if (!body.ok) return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  const { caseId, requestText } = (body.body ?? {}) as { caseId?: string; requestText?: string };
  if (!caseId || typeof caseId !== "string") {
    return api.error(400, "caseId가 필요합니다.", { code: "MISSING_CASE_ID" });
  }
  if (!requestText || typeof requestText !== "string" || requestText.trim().length < 5) {
    return api.error(400, "보완 요청 텍스트가 너무 짧습니다.", { code: "REQUEST_TEXT_TOO_SHORT" });
  }

  try {
    const draft = await draftSupplementResponse(caseId, requestText);
    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Case not found")) {
      return api.error(404, "사건을 찾을 수 없습니다.", { code: "CASE_NOT_FOUND" });
    }
    api.logError(error);
    return api.error(500, "보완 답변 초안 생성에 실패했습니다.", { code: "SUPPLEMENT_DRAFT_FAILED" });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.supplement_response.put");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) return api.error(400, "문의 ID 형식이 올바르지 않습니다.", { code: "INVALID_INQUIRY_ID" });

  const body = await safeReadJsonBody(request);
  if (!body.ok) return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });

  const payload = (body.body ?? {}) as {
    caseId?: string;
    subject?: string;
    body?: string;
    citedProvisions?: string[];
    requiredDocuments?: string[];
    autoSend?: boolean;
  };

  if (!payload.caseId || typeof payload.caseId !== "string") {
    return api.error(400, "caseId가 필요합니다.", { code: "MISSING_CASE_ID" });
  }
  if (!payload.body || typeof payload.body !== "string" || payload.body.trim().length === 0) {
    return api.error(400, "본문이 비어 있습니다.", { code: "EMPTY_BODY" });
  }

  try {
    const note = [
      "─── [보완 답변 초안 저장] ───",
      `저장 시각: ${new Date().toISOString()}`,
      `문의 ID: ${id}`,
      `제목: ${payload.subject ?? ""}`,
      `자동전송 예약: ${payload.autoSend ? "예 (담당자 최종 승인 필요)" : "아니오"}`,
      "",
      "[본문]",
      payload.body,
      ""
    ];
    if (payload.citedProvisions && payload.citedProvisions.length > 0) {
      note.push("[근거 조항]");
      note.push(...payload.citedProvisions.map((p) => `- ${p}`));
      note.push("");
    }
    if (payload.requiredDocuments && payload.requiredDocuments.length > 0) {
      note.push("[제출 서류]");
      note.push(...payload.requiredDocuments.map((d) => `- ${d}`));
    }
    const appended = `\n\n${note.join("\n")}`;

    const existing = await prisma.caseMatter.findUnique({
      where: { id: payload.caseId },
      select: { internalMemo: true }
    });
    if (!existing) return api.error(404, "사건을 찾을 수 없습니다.", { code: "CASE_NOT_FOUND" });

    await prisma.caseMatter.update({
      where: { id: payload.caseId },
      data: {
        internalMemo: `${existing.internalMemo ?? ""}${appended}`
      }
    });

    // 자동 전송 요청 시: 실제 발송은 별도 승인 파이프라인이 필요하므로 여기서는 큐 표시만 남긴다.
    if (payload.autoSend) {
      await prisma.siteSetting.upsert({
        where: { key: `supplement.autosend.queue.${payload.caseId}` },
        create: {
          key: `supplement.autosend.queue.${payload.caseId}`,
          value: JSON.stringify({
            inquiryId: id,
            subject: payload.subject ?? "",
            queuedAt: new Date().toISOString(),
            status: "PENDING_APPROVAL"
          })
        },
        update: {
          value: JSON.stringify({
            inquiryId: id,
            subject: payload.subject ?? "",
            queuedAt: new Date().toISOString(),
            status: "PENDING_APPROVAL"
          })
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    api.logError(error);
    return api.error(500, "보완 답변을 저장하지 못했습니다.", { code: "SUPPLEMENT_SAVE_FAILED" });
  }
}
