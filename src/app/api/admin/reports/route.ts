import { NextResponse } from "next/server";

import {
  generateReport,
  generateReportHTML,
  generateReportMarkdown,
  type ReportPeriod,
} from "@/lib/services/business-report-service";

export const dynamic = "force-dynamic";

const VALID_PERIODS: ReportPeriod[] = ["weekly", "monthly", "quarterly"];

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  let body: { period?: string; action?: string } = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  const period = body.period;
  if (!period || !VALID_PERIODS.includes(period as ReportPeriod)) {
    return NextResponse.json(
      { error: "Invalid or missing period. Use weekly | monthly | quarterly." },
      { status: 400 },
    );
  }

  const report = await generateReport(period as ReportPeriod);

  if (format === "html") {
    return new NextResponse(generateReportHTML(report), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (format === "md") {
    return new NextResponse(generateReportMarkdown(report), {
      status: 200,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  if (body.action === "email") {
    // Stubbed email send: integration with mailer would go here.
    return NextResponse.json({ ok: true, queued: true, period });
  }

  return NextResponse.json(report);
}
