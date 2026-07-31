/**
 * 문서 서식(템플릿) 관리 API.
 *
 * 스코프가 drive.file(앱이 만든 파일만)이라, 서식은 **앱이 빈 문서를 생성**하고
 * 관리자가 Google Docs 에서 디자인({{변수}} 삽입)한 뒤 변수만 다시 스캔한다.
 * 이러면 PII 보호용 drive.file 을 유지하면서 복사·치환이 동작한다.
 *
 * /api/admin/* 는 middleware 가 인증을 먼저 막는다.
 *
 *   GET    /api/admin/doc-templates            → 서식 목록 + 표준 변수
 *   POST   { action: "create", name }          → 빈 서식 문서 생성 + 등록
 *   POST   { action: "rescan", slug }          → 문서에서 {{변수}} 다시 추출
 *   DELETE /api/admin/doc-templates?slug=xxx   → 등록 삭제(구글 문서는 남음)
 */

import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import {
  STANDARD_VARIABLES,
  deleteTemplate,
  getTemplate,
  listTemplates,
  registerTemplate
} from "@/lib/services/google-doc-template-service";
import { createDoc, extractPlaceholders } from "@/lib/services/google-docs-service";
import { getOrCreateCaseFolder } from "@/lib/services/google-drive-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const api = createAdminRequestContext("admin.doc-templates.get");
  try {
    const templates = await listTemplates();
    return api.ok({ ok: true, templates, standardVariables: STANDARD_VARIABLES });
  } catch (error) {
    api.logError(error);
    return api.error(500, "서식 목록을 불러오지 못했습니다.", { code: "LIST_FAILED" });
  }
}

export async function POST(request: Request) {
  const api = createAdminRequestContext("admin.doc-templates.post");
  const parsed = await safeReadJsonBody(request);
  const body = (parsed.ok ? parsed.body : {}) as {
    action?: "create" | "rescan";
    name?: string;
    slug?: string;
  };

  try {
    if (body.action === "rescan") {
      const slug = body.slug?.trim();
      if (!slug) return api.error(400, "slug 가 필요합니다.", { code: "MISSING_SLUG" });
      const tpl = await getTemplate(slug);
      if (!tpl) return api.error(404, "서식을 찾을 수 없습니다.", { code: "TEMPLATE_NOT_FOUND" });

      const variables = await extractPlaceholders({ documentId: tpl.templateDocId });
      if (variables === null) {
        return api.error(409, "문서에 접근할 수 없습니다. 구글 연결을 확인하세요.", {
          code: "DOC_NOT_ACCESSIBLE"
        });
      }
      const updated = await registerTemplate({
        slug: tpl.slug,
        name: tpl.name,
        templateDocId: tpl.templateDocId,
        variables
      });
      return api.ok({ ok: true, template: updated });
    }

    // 기본: 새 서식 생성
    const name = body.name?.trim();
    if (!name) return api.error(400, "서식 이름이 필요합니다.", { code: "MISSING_NAME" });

    // 서식들을 모아둘 전용 폴더(사건 폴더와 분리).
    const folder = await getOrCreateCaseFolder("_서식템플릿");
    const doc = await createDoc({
      title: `[서식] ${name}`,
      bodyText:
        `${name}\n\n` +
        `여기에 서식 내용을 작성하세요.\n` +
        `치환할 자리에는 {{변수}} 형식을 넣습니다. 예: {{의뢰인}}, {{사건번호}}, {{작성일}}\n`,
      folderId: folder?.folderId
    });
    if (!doc) {
      return api.error(409, "구글 미연결 또는 문서 생성 실패. 구글 연결을 확인하세요.", {
        code: "NOT_CONNECTED_OR_FAILED"
      });
    }

    // 초기 본문의 예시 변수 추출.
    const variables = (await extractPlaceholders({ documentId: doc.documentId })) ?? [];
    const tpl = await registerTemplate({ name, templateDocId: doc.documentId, variables });
    return api.ok({ ok: true, template: tpl, editUrl: doc.url });
  } catch (error) {
    api.logError(error);
    return api.error(500, "서식 처리에 실패했습니다.", { code: "TEMPLATE_OP_FAILED" });
  }
}

export async function DELETE(request: Request) {
  const api = createAdminRequestContext("admin.doc-templates.delete");
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) return api.error(400, "slug 가 필요합니다.", { code: "MISSING_SLUG" });
  try {
    await deleteTemplate(slug);
    return api.ok({ ok: true });
  } catch (error) {
    api.logError(error);
    return api.error(500, "서식 삭제에 실패했습니다.", { code: "DELETE_FAILED" });
  }
}
