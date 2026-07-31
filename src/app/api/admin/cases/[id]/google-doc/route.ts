/**
 * 사건 → 구글 Docs 문서 생성.
 *
 * generate-doc(HTML/PDF 출력)와 달리 편집·공유 가능한 구글 문서를 만들어
 * 사건 Drive 폴더에 넣는다. 관리자가 /admin/integrations/google-services 에서
 * 구글 연결을 해둬야 동작한다(미연결 시 not_connected).
 *
 *   POST /api/admin/cases/{id}/google-doc  { docType: "power_of_attorney" | "consult_summary" }
 *   → { ok, url }
 */

import { NextResponse } from "next/server";

import { createAdminRequestContext, safeReadJsonBody } from "@/lib/http/admin-api";
import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { getCaseMatterById } from "@/lib/services/case-matter-service";
import { getOrCreateCaseFolder } from "@/lib/services/google-drive-service";
import { createDoc, exportFile, generateFromTemplate } from "@/lib/services/google-docs-service";
import { buildReplacements, getTemplate } from "@/lib/services/google-doc-template-service";
import { prisma } from "@/lib/prisma/client";

type DocType = "power_of_attorney" | "consult_summary";

/** SiteSetting 에 저장된 사건 Drive 폴더 링크를 읽는다(없으면 null). */
async function readCaseFolder(
  caseId: string
): Promise<{ folderId: string; webViewLink?: string } | null> {
  const row = await prisma.siteSetting
    .findUnique({ where: { key: `case.drivefolder.${caseId}` } })
    .catch(() => null);
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value) as { folderId?: string; webViewLink?: string };
    return parsed.folderId ? { folderId: parsed.folderId, webViewLink: parsed.webViewLink } : null;
  } catch {
    return null;
  }
}

async function recordCaseFolder(
  caseId: string,
  folder: { folderId: string; webViewLink?: string }
) {
  const value = JSON.stringify({
    folderId: folder.folderId,
    webViewLink: folder.webViewLink ?? null,
    createdAt: new Date().toISOString()
  });
  await prisma.siteSetting.upsert({
    where: { key: `case.drivefolder.${caseId}` },
    create: { key: `case.drivefolder.${caseId}`, value },
    update: { value }
  });
}

function clientNameOf(parties: { role: string; name: string }[]): string {
  return parties.find((p) => p.role === "CLIENT")?.name ?? "(의뢰인)";
}

function buildBody(
  docType: DocType,
  cm: {
    caseNo: string | null;
    title: string;
    matterType: string;
    category: string;
    summary: string | null;
    parties: { role: string; name: string }[];
  }
): { title: string; body: string } {
  const client = clientNameOf(cm.parties);
  const caseNo = cm.caseNo ?? "-";
  const today = new Date().toISOString().slice(0, 10);

  if (docType === "consult_summary") {
    return {
      title: `상담 요약서 - ${cm.title} (${caseNo})`,
      body: [
        `상담 요약서`,
        ``,
        `작성일: ${today}`,
        `사건번호: ${caseNo}`,
        `사건명: ${cm.title}`,
        `분야: ${cm.category}`,
        `의뢰인: ${client}`,
        ``,
        `[사건 개요]`,
        cm.summary?.trim() || "(요약 미작성 — 상담 내용을 여기에 정리하세요.)",
        ``,
        `[검토 의견]`,
        ``,
        `[다음 절차]`,
        ``,
        `행정사 ETHOS`
      ].join("\n")
    };
  }

  // power_of_attorney
  return {
    title: `위임장 - ${client} (${caseNo})`,
    body: [
      `위 임 장`,
      ``,
      `사건번호: ${caseNo}`,
      `사건명: ${cm.title}`,
      ``,
      `위임인(의뢰인): ${client}`,
      `수임인: 행정사 ETHOS`,
      ``,
      `위임인은 아래 사건에 관한 행정사 업무 일체를 수임인에게 위임합니다.`,
      ``,
      `1. 위임 사무: ${cm.matterType} (${cm.category})`,
      `2. 위임 범위: 신청·제출·보정·수령 등 관련 행정사 업무 일체`,
      ``,
      `작성일: ${today}`,
      ``,
      `위임인: ${client}          (서명 또는 인)`,
      `수임인: 행정사 ETHOS       (서명 또는 인)`
    ].join("\n")
  };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const api = createAdminRequestContext("admin.cases.google-doc.post");
  const { id: rawCaseId } = await context.params;
  const caseId = normalizeAdminEntityId(rawCaseId);
  if (!caseId) return api.error(400, "Invalid case id.", { code: "INVALID_CASE_ID" });

  const parsed = await safeReadJsonBody(request);
  const body = (parsed.ok ? parsed.body : {}) as {
    docType?: DocType;
    templateSlug?: string;
    format?: "doc" | "pdf";
  };
  const wantPdf = body.format === "pdf";

  try {
    const cm = await getCaseMatterById(caseId);
    if (!cm) return api.error(404, "사건을 찾을 수 없습니다.", { code: "CASE_NOT_FOUND" });

    // 사건 폴더 확보(저장돼 있으면 재사용, 없으면 생성).
    const label = `${cm.caseNo ?? cm.id} ${cm.title}`.trim().slice(0, 120);
    let folder = await readCaseFolder(caseId);
    if (!folder) {
      folder = await getOrCreateCaseFolder(label);
      if (folder?.folderId) await recordCaseFolder(caseId, folder);
    }

    const partiesFull = cm.parties.map((p) => ({
      role: p.role,
      name: p.name,
      phone: p.phone ?? null,
      email: p.email ?? null,
      organization: p.organization ?? null,
      nationality: p.nationality ?? null
    }));

    let doc: { documentId: string; url: string } | null = null;
    let docTitle: string;

    if (body.templateSlug) {
      // 등록된 서식 → 복사 + 플레이스홀더 치환.
      const tpl = await getTemplate(body.templateSlug);
      if (!tpl) return api.error(404, "서식을 찾을 수 없습니다.", { code: "TEMPLATE_NOT_FOUND" });
      const replacements = buildReplacements({
        caseNo: cm.caseNo,
        title: cm.title,
        matterType: cm.matterType,
        category: cm.category,
        summary: cm.summary ?? null,
        parties: partiesFull
      });
      docTitle = `${tpl.name} - ${replacements["의뢰인"]} (${replacements["사건번호"]})`;
      doc = await generateFromTemplate({
        templateDocId: tpl.templateDocId,
        title: docTitle,
        replacements,
        folderId: folder?.folderId
      });
    } else {
      // 내장 서식(위임장 / 상담요약).
      const docType: DocType =
        body.docType === "consult_summary" ? "consult_summary" : "power_of_attorney";
      const built = buildBody(docType, {
        caseNo: cm.caseNo,
        title: cm.title,
        matterType: cm.matterType,
        category: cm.category,
        summary: cm.summary ?? null,
        parties: partiesFull.map((p) => ({ role: p.role, name: p.name }))
      });
      docTitle = built.title;
      doc = await createDoc({ title: built.title, bodyText: built.body, folderId: folder?.folderId });
    }

    if (!doc) {
      return api.error(409, "구글 미연결 또는 문서 생성 실패. 구글 연결을 확인하세요.", {
        code: "NOT_CONNECTED_OR_FAILED"
      });
    }

    // PDF 요청이면 문서를 PDF 로 내보내 바이트 스트림 반환.
    if (wantPdf) {
      const exported = await exportFile({ fileId: doc.documentId, mimeType: "application/pdf" });
      if (!exported) {
        // PDF 실패해도 편집용 문서는 만들어졌으니 URL 은 준다.
        return api.ok({ ok: true, url: doc.url, documentId: doc.documentId, pdf: false });
      }
      const safeName = docTitle.replace(/[\\/:*?"<>|]/g, "_").slice(0, 100);
      return new NextResponse(new Uint8Array(exported.data), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}.pdf"`,
          "Cache-Control": "no-store"
        }
      });
    }

    return api.ok({ ok: true, url: doc.url, documentId: doc.documentId });
  } catch (error) {
    api.logError(error);
    return api.error(500, "구글 문서 생성에 실패했습니다.", { code: "GOOGLE_DOC_FAILED" });
  }
}
