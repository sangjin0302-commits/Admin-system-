import { NextResponse } from "next/server";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  generateChecklist,
  loadChecklistState,
  saveChecklistState,
  type Checklist
} from "@/lib/services/checklist-generator-service";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.cases.checklist.get");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) return api.error(400, "잘못된 사건 ID입니다.", { code: "INVALID_CASE_ID" });

  try {
    const state = await loadChecklistState(id);
    if (!state) return api.error(404, "체크리스트가 아직 생성되지 않았습니다.", { code: "CHECKLIST_NOT_FOUND" });
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    api.logError(error);
    return api.error(500, "체크리스트를 불러오지 못했습니다.", { code: "CHECKLIST_LOAD_FAILED" });
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.cases.checklist.post");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) return api.error(400, "잘못된 사건 ID입니다.", { code: "INVALID_CASE_ID" });

  try {
    const checklist = await generateChecklist(id);
    const state = await saveChecklistState(id, checklist, []);
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Case not found")) {
      return api.error(404, "사건을 찾을 수 없습니다.", { code: "CASE_NOT_FOUND" });
    }
    api.logError(error);
    return api.error(500, "체크리스트 생성에 실패했습니다.", { code: "CHECKLIST_GENERATE_FAILED" });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.cases.checklist.put");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) return api.error(400, "잘못된 사건 ID입니다.", { code: "INVALID_CASE_ID" });

  const body = await safeReadJsonBody(request);
  if (!body.ok) return api.error(400, "요청 본문(JSON)을 확인해 주세요.", { code: "INVALID_JSON_BODY" });
  const payload = (body.body ?? {}) as { checklist?: Checklist; doneIds?: string[] };
  if (!payload.checklist || !Array.isArray(payload.checklist.steps)) {
    return api.error(400, "체크리스트 데이터가 유효하지 않습니다.", { code: "INVALID_CHECKLIST" });
  }
  const doneIds = Array.isArray(payload.doneIds)
    ? payload.doneIds.filter((s): s is string => typeof s === "string")
    : [];

  try {
    const state = await saveChecklistState(id, payload.checklist, doneIds);
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    api.logError(error);
    return api.error(500, "체크리스트 저장에 실패했습니다.", { code: "CHECKLIST_SAVE_FAILED" });
  }
}
