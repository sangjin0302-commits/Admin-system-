import { normalizeAdminEntityId } from "@/lib/http/admin-id";
import { createAdminRequestContext } from "@/lib/http/admin-api";
import { loadChecklistState } from "@/lib/services/checklist-generator-service";
import { prisma } from "@/lib/prisma/client";

export const maxDuration = 30;

// PDF library 도입 없이 브라우저 인쇄 기능을 활용하는 프린트 친화적 HTML 응답.
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const api = createAdminRequestContext("admin.cases.checklist.pdf");
  const { id: rawId } = await context.params;
  const id = normalizeAdminEntityId(rawId);
  if (!id) return api.error(400, "잘못된 사건 ID입니다.", { code: "INVALID_CASE_ID" });

  try {
    const state = await loadChecklistState(id);
    if (!state) return api.error(404, "체크리스트가 없습니다.", { code: "CHECKLIST_NOT_FOUND" });
    const caseInfo = await prisma.caseMatter.findUnique({
      where: { id },
      select: { title: true, caseNo: true }
    });
    const title = caseInfo?.title ?? "사건";
    const caseNo = caseInfo?.caseNo ?? "";

    const rows = state.checklist.steps
      .map((s) => {
        const done = state.doneIds.includes(s.id);
        const docs = s.requiredDocuments.length ? `<div class="docs">필요 서류: ${s.requiredDocuments.map(escapeHtml).join(", ")}</div>` : "";
        return `<li class="${done ? "done" : ""}">
          <div class="row">
            <span class="check">${done ? "☑" : "☐"}</span>
            <div>
              <div class="title">${escapeHtml(s.title)} <span class="offset">D+${s.dueDayOffset}</span></div>
              <div class="desc">${escapeHtml(s.description)}</div>
              ${docs}
            </div>
          </div>
        </li>`;
      })
      .join("\n");

    const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>체크리스트 - ${escapeHtml(title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .caseNo { color: #666; margin-bottom: 24px; font-size: 12px; }
  ol { list-style: none; padding: 0; }
  li { border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
  li.done { background: #f0fdf4; }
  .row { display: flex; gap: 10px; }
  .check { font-size: 18px; }
  .title { font-weight: 600; font-size: 14px; }
  .offset { color: #666; font-weight: 400; font-size: 11px; margin-left: 6px; }
  .desc { font-size: 12px; color: #444; margin-top: 4px; }
  .docs { font-size: 11px; color: #666; margin-top: 4px; }
  @media print { body { padding: 12px; } .noprint { display: none; } }
</style></head>
<body>
  <h1>사건 체크리스트: ${escapeHtml(title)}</h1>
  <div class="caseNo">${caseNo ? `사건번호: ${escapeHtml(caseNo)} · ` : ""}생성: ${new Date(state.checklist.generatedAt).toLocaleString()}</div>
  <p class="noprint" style="font-size:11px;color:#888;">브라우저 인쇄 대화상자에서 "PDF로 저장"을 선택하세요.</p>
  <ol>${rows}</ol>
</body></html>`;

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "PDF 뷰 생성에 실패했습니다.", { code: "CHECKLIST_PDF_FAILED" });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
