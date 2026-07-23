import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

function parseMonth(m: string | null): { start: Date; end: Date; key: string } {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    year = y; month = mo - 1;
  }
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return { start, end, key: `${year}-${String(month + 1).padStart(2, "0")}` };
}

function csvCell(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  if (!(await isFeatureEnabled("tax_export_csv"))) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const url = new URL(req.url);
  const { start, end, key } = parseMonth(url.searchParams.get("month"));

  try {
    const rows = await prisma.inquiry.findMany({
      where: { status: "WON", updatedAt: { gte: start, lt: end } },
      select: {
        id: true, title: true, contactName: true, email: true,
        phone: true, intakeChannel: true, intakePracticeArea: true,
        createdAt: true, updatedAt: true,
      },
      orderBy: { updatedAt: "asc" },
    });

    const header = [
    "id", "title", "contactName", "contactEmail", "contactPhone",
    "intakeChannel", "practiceArea", "createdAt", "wonAt",
  ].join(",");

  const lines = rows.map((r) =>
    [
      csvCell(r.id),
      csvCell(r.title),
      csvCell(r.contactName),
      csvCell(r.email),
      csvCell(r.phone),
      csvCell(r.intakeChannel),
      csvCell(r.intakePracticeArea),
      csvCell(r.createdAt.toISOString()),
      csvCell(r.updatedAt.toISOString()),
    ].join(",")
  );

    const csv = "﻿" + [header, ...lines].join("\r\n"); // BOM for Excel Korean

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tax-export-${key}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin/tax-export] failed", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
