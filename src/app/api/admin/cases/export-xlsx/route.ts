import ExcelJS from "exceljs";

import { createAdminRequestContext } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";

const NAVY = "FF1A3C5F";
const GOLD = "FFC9A961";
const IVORY = "FFF5EDE0";

export async function GET(request: Request) {
  const api = createAdminRequestContext("admin.cases.export.xlsx");
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

    const wb = new ExcelJS.Workbook();
    wb.creator = "ETHOS Administrative Attorney Office";
    wb.created = new Date();

    const ws = wb.addWorksheet("사건 목록");
    ws.columns = [
      { header: "사건번호", key: "caseNo", width: 18 },
      { header: "사건명", key: "title", width: 35 },
      { header: "카테고리", key: "category", width: 20 },
      { header: "상태", key: "status", width: 16 },
      { header: "우선순위", key: "priority", width: 10 },
      { header: "위험도", key: "riskLevel", width: 10 },
      { header: "의뢰인", key: "contactName", width: 14 },
      { header: "연락처", key: "phone", width: 14 },
      { header: "이메일", key: "email", width: 25 },
      { header: "견적", key: "feeAmount", width: 14, style: { numFmt: "#,##0" } },
      { header: "입금", key: "paidAmount", width: 14, style: { numFmt: "#,##0" } },
      { header: "결제 상태", key: "paymentStatus", width: 12 },
      { header: "생성일", key: "createdAt", width: 12 },
      { header: "마감일", key: "dueDate", width: 12 },
      { header: "담당자", key: "assignedTo", width: 12 }
    ];

    // 헤더 스타일
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thick", color: { argb: GOLD } }
      };
    });
    ws.getRow(1).height = 28;

    // 데이터
    cases.forEach((c, i) => {
      const row = ws.addRow({
        caseNo: c.caseNo ?? "-",
        title: c.title,
        category: c.category,
        status: c.status,
        priority: c.priority,
        riskLevel: c.riskLevel,
        contactName: c.inquiry?.contactName ?? "-",
        phone: c.inquiry?.phone ?? "-",
        email: c.inquiry?.email ?? "-",
        feeAmount: c.accountingMemo?.feeAmount ?? null,
        paidAmount: c.accountingMemo?.paidAmount ?? null,
        paymentStatus: c.accountingMemo?.paymentStatus ?? "-",
        createdAt: c.createdAt.toISOString().slice(0, 10),
        dueDate: c.dueDate?.toISOString().slice(0, 10) ?? "-",
        assignedTo: c.assignedTo ?? "-"
      });
      if (i % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: IVORY } };
        });
      }
    });

    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

    // 통계 시트
    const summary = wb.addWorksheet("요약");
    summary.columns = [
      { header: "구분", key: "label", width: 24 },
      { header: "값", key: "value", width: 20 }
    ];
    summary.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    });
    summary.addRow({ label: "총 사건 수", value: cases.length });
    summary.addRow({
      label: "견적 합계",
      value: cases.reduce((s, c) => s + (c.accountingMemo?.feeAmount ?? 0), 0)
    });
    summary.addRow({
      label: "입금 합계",
      value: cases.reduce((s, c) => s + (c.accountingMemo?.paidAmount ?? 0), 0)
    });
    summary.addRow({ label: "내보낸 일시", value: new Date().toISOString() });

    const buffer = await wb.xlsx.writeBuffer();
    const filename = `cases-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "Excel export 실패", { code: "XLSX_EXPORT_FAILED" });
  }
}
