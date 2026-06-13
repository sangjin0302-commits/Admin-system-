import { createAdminRequestContext } from "@/lib/http/admin-api";
import { prisma } from "@/lib/prisma/client";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const api = createAdminRequestContext("admin.cases.export.csv");
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
        inquiry: { select: { contactName: true, email: true, phone: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const headers = [
      "사건번호",
      "사건명",
      "카테고리",
      "상태",
      "우선순위",
      "위험도",
      "의뢰인",
      "연락처",
      "이메일",
      "생성일",
      "마감일",
      "다음 조치일",
      "담당자"
    ];
    const rows = cases.map((c) =>
      [
        c.caseNo,
        c.title,
        c.category,
        c.status,
        c.priority,
        c.riskLevel,
        c.inquiry?.contactName,
        c.inquiry?.phone,
        c.inquiry?.email,
        c.createdAt.toISOString().slice(0, 10),
        c.dueDate?.toISOString().slice(0, 10),
        c.nextActionAt?.toISOString().slice(0, 10),
        c.assignedTo
      ].map(csvEscape).join(",")
    );
    const csv = "﻿" + [headers.join(","), ...rows].join("\n");
    const filename = `cases-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    api.logError(error);
    return api.error(500, "CSV export 실패", { code: "CSV_EXPORT_FAILED" });
  }
}
