import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import {
  generateReport,
  generateReportHTML,
  generateReportMarkdown,
  type ReportPeriod,
} from "@/lib/services/business-report-service";

import { ReportActions } from "./report-actions";

export const dynamic = "force-dynamic";

const VALID_PERIODS: ReportPeriod[] = ["weekly", "monthly", "quarterly"];

const PERIOD_LABELS: Record<string, string> = {
  weekly: "주간",
  monthly: "월간",
  quarterly: "분기",
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ period: string }>;
}) {
  const { period } = await params;
  if (!VALID_PERIODS.includes(period as ReportPeriod)) {
    notFound();
  }

  const report = await generateReport(period as ReportPeriod);
  const html = generateReportHTML(report);
  const markdown = generateReportMarkdown(report);

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">보고서</div>
        <h1 className="ui-page-title">
          {PERIOD_LABELS[period] ?? period} 경영 보고서
        </h1>
        <div className="text-sm text-gray-500">
          {report.startDate.toISOString().slice(0, 10)} –{" "}
          {report.endDate.toISOString().slice(0, 10)}
        </div>
        <Link
          href="/admin/reports"
          className="mt-2 inline-block text-sm hover:underline"
          style={{ color: "#1a3c5f" }}
        >
          &larr; 보고서 목록으로 돌아가기
        </Link>
      </div>

      <Card>
        <ReportActions report={report} html={html} markdown={markdown} />
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">요약</h2>
        <p className="text-sm leading-relaxed">{report.summary}</p>
      </Card>

      {report.sections.map((section) => (
        <Card key={section.title}>
          <h2
            className="mb-3 border-b pb-1 text-lg font-semibold"
            style={{ borderColor: "#c9a961", color: "#1a3c5f" }}
          >
            {section.title}
          </h2>
          <table className="mb-3 w-full text-sm">
            <tbody>
              {section.metrics.map((m) => (
                <tr key={m.label} className="border-b">
                  <td className="py-1 text-gray-600">{m.label}</td>
                  <td className="py-1 font-semibold">{m.value}</td>
                  <td
                    className="py-1 text-right"
                    style={{
                      color:
                        m.change == null
                          ? undefined
                          : m.change >= 0
                            ? "#16a34a"
                            : "#dc2626",
                    }}
                  >
                    {m.change != null
                      ? `${m.change >= 0 ? "+" : ""}${m.change}%`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {section.insights.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
              {section.insights.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
