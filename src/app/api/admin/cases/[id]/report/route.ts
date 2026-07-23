import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import {
  generateCaseReportPdf,
  type CaseReportData,
} from "@/lib/services/case-report-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const caseMatter = await prisma.caseMatter.findUnique({
    where: { id },
    include: {
      parties: {
        where: { role: "CLIENT" },
        take: 1,
      },
      requiredDocuments: {
        orderBy: { createdAt: "asc" },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!caseMatter) {
    return NextResponse.json(
      { error: "Case not found" },
      { status: 404 },
    );
  }

  const client = caseMatter.parties[0];

  const data: CaseReportData = {
    title: caseMatter.title,
    caseNo: caseMatter.caseNo,
    status: caseMatter.status,
    clientName: client?.name ?? "-",
    clientEmail: client?.email ?? null,
    clientPhone: client?.phone ?? null,
    matterType: caseMatter.matterType,
    category: caseMatter.category,
    priority: caseMatter.priority,
    riskLevel: caseMatter.riskLevel,
    assignedTo: caseMatter.assignedTo,
    summary: caseMatter.summary,
    createdAt: caseMatter.createdAt.toISOString(),
    updatedAt: caseMatter.updatedAt.toISOString(),
    dueDate: caseMatter.dueDate?.toISOString() ?? null,
    nextActionAt: caseMatter.nextActionAt?.toISOString() ?? null,
    events: caseMatter.events.map((e) => ({
      date: e.createdAt.toISOString(),
      type: e.eventType,
      message: e.message,
    })),
    documents: caseMatter.requiredDocuments.map((d) => ({
      name: d.name,
      status: d.status,
      required: d.required,
    })),
  };

  const pdfBuffer = await generateCaseReportPdf(data);

  const filename = `case-report-${caseMatter.caseNo ?? id}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("[admin/cases/report] render failed", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
