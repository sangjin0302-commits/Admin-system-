/**
 * 사건대장 → 구글 Sheets 내보내기.
 *
 * export-xlsx(다운로드)와 달리 구글 스프레드시트를 만들어 클라우드에서 공유·편집.
 * 구글 연결 + spreadsheets 스코프 필요(미연결 시 409).
 *
 *   POST /api/admin/cases/export-sheets?category=&q=  → { ok, url }
 */

import { createAdminRequestContext } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";
import { exportRowsToSheet } from "@/lib/services/google-sheets-service";
import { requireRole } from "@/lib/services/admin-rbac-service";

const HEADERS = [
  "사건번호",
  "사건명",
  "카테고리",
  "상태",
  "우선순위",
  "위험도",
  "의뢰인",
  "연락처",
  "이메일",
  "견적",
  "입금",
  "결제상태",
  "생성일",
  "마감일",
  "담당자"
];

export async function POST(request: Request) {
  const guard = await requireRole(request, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  const api = createAdminRequestContext("admin.cases.export.sheets");
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { caseNo: { contains: q } },
      { inquiry: { contactName: { contains: q } } }
    ];
  }

  try {
    const cases = await prisma.caseMatter.findMany({
      where: where as never,
      include: {
        inquiry: { select: { contactName: true, email: true, phone: true } },
        accountingMemo: { select: { feeAmount: true, paidAmount: true, paymentStatus: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const rows: (string | number | null)[][] = cases.map((c) => [
      c.caseNo ?? "-",
      c.title,
      c.category,
      c.status,
      c.priority,
      c.riskLevel,
      c.inquiry?.contactName ?? "-",
      c.inquiry?.phone ?? "-",
      c.inquiry?.email ?? "-",
      c.accountingMemo?.feeAmount ?? null,
      c.accountingMemo?.paidAmount ?? null,
      c.accountingMemo?.paymentStatus ?? "-",
      c.createdAt.toISOString().slice(0, 10),
      c.dueDate?.toISOString().slice(0, 10) ?? "-",
      c.assignedTo ?? "-"
    ]);

    const title = `ETHOS 사건대장 ${new Date().toISOString().slice(0, 10)}`;
    const sheet = await exportRowsToSheet({ title, headers: HEADERS, rows });
    if (!sheet) {
      return api.error(409, "구글 미연결 또는 시트 생성 실패. 구글 연결·스코프를 확인하세요.", {
        code: "NOT_CONNECTED_OR_FAILED"
      });
    }

    return api.ok({ ok: true, url: sheet.url, count: cases.length });
  } catch (error) {
    api.logError(error);
    return api.error(500, "구글 시트 내보내기에 실패했습니다.", { code: "SHEETS_EXPORT_FAILED" });
  }
}
