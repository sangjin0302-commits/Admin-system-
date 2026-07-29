import { ZodError } from "zod";
import { after } from "next/server";

import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext, firstZodMessage, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  CaseMatterConversionError,
  convertInquiryToCaseMatter,
  listCaseMattersForInquiry
} from "@/lib/services/case-matter-service";
import { convertInquiryToCaseMatterSchema } from "@/lib/validation/case-matter";
import { prisma } from "@/lib/prisma/client";

/** 생성된 Drive 사건폴더 링크를 SiteSetting 에 기록(포털/사건화면에서 재사용). */
async function recordCaseFolder(
  caseId: string,
  folder: { folderId: string; webViewLink?: string }
) {
  const key = `case.drivefolder.${caseId}`;
  const value = JSON.stringify({
    folderId: folder.folderId,
    webViewLink: folder.webViewLink ?? null,
    createdAt: new Date().toISOString()
  });
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value }
  });
}

function toSafeCaseMatterSummary(caseMatter: {
  id: string;
  caseNo: string | null;
  title: string;
  matterType: string;
  status: string;
}) {
  return {
    id: caseMatter.id,
    caseNo: caseMatter.caseNo ?? "-",
    title: caseMatter.title,
    matterType: caseMatter.matterType,
    status: caseMatter.status
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.case-matters.get");
  const { id: rawId } = await context.params;
  const inquiryId = normalizeAdminEntityId(rawId);

  if (!inquiryId) {
    return api.error(400, "Invalid inquiry id format.", { code: "INVALID_INQUIRY_ID" });
  }

  try {
    const caseMatters = await listCaseMattersForInquiry(inquiryId);
    return api.ok({
      ok: true,
      inquiryId,
      count: caseMatters.length,
      caseMatters: caseMatters.map(toSafeCaseMatterSummary)
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Failed to load case matters.", {
      code: "CASE_MATTERS_LIST_FAILED"
    });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.inquiries.case-matters.post");
  const { id: rawId } = await context.params;
  const inquiryId = normalizeAdminEntityId(rawId);

  if (!inquiryId) {
    return api.error(400, "Invalid inquiry id format.", { code: "INVALID_INQUIRY_ID" });
  }

  try {
    const bodyResult = await safeReadJsonBody(request);
    const rawBody = bodyResult.ok
      ? bodyResult.body ?? {}
      : request.headers.get("content-length") === "0"
        ? {}
        : null;

    if (!rawBody) {
      return api.error(400, "Check request JSON body.", { code: "INVALID_JSON_BODY" });
    }

    const payload = convertInquiryToCaseMatterSchema.parse(rawBody);
    const result = await convertInquiryToCaseMatter({
      inquiryId,
      ...payload
    });

    // 새 사건이면 구글 Drive 사건폴더 자동 생성. 미연결/실패해도 사건 생성은 이미
    // 커밋됐으므로 응답을 막지 않는다. after()로 응답 후 실행하되 서버리스에서
    // 함수가 얼지 않고 완료되도록 보장한다(bare floating promise 는 유실 위험).
    if (result.created) {
      const cm = result.caseMatter;
      const label = `${cm.caseNo ?? cm.id} ${cm.title}`.trim().slice(0, 120);
      after(async () => {
        try {
          const { getOrCreateCaseFolder } = await import(
            "@/lib/services/google-drive-service"
          );
          const folder = await getOrCreateCaseFolder(label);
          if (folder?.folderId) {
            await recordCaseFolder(cm.id, folder);
          }
        } catch {
          /* Drive 폴더 생성은 best-effort */
        }
      });
    }

    return api.ok(
      {
        ok: true,
        inquiryId,
        created: result.created,
        caseMatter: toSafeCaseMatterSummary(result.caseMatter),
        linkedQuoteId: result.linkedQuoteId,
        linkedContractDraftId: result.linkedContractDraftId
      },
      { status: result.created ? 201 : 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return api.error(400, firstZodMessage(error, "Check request fields."), {
        code: "VALIDATION_ERROR"
      });
    }

    if (error instanceof CaseMatterConversionError) {
      return api.error(404, error.message, { code: error.code });
    }

    api.logError(error);
    return api.error(500, "Failed to convert inquiry into case matter.", {
      code: "CONVERT_CASE_MATTER_FAILED"
    });
  }
}
