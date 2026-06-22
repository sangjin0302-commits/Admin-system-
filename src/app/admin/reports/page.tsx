import Link from "next/link";

import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// In-memory recent reports log (resets on server restart).
type RecentReport = { period: string; generatedAt: Date };
const globalAny = globalThis as unknown as { __recentReports?: RecentReport[] };
const recentReports: RecentReport[] = globalAny.__recentReports ?? [];
globalAny.__recentReports = recentReports;

export default async function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">Reports</div>
        <h1 className="ui-page-title">Business Reports</h1>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Generate New Report</h2>
        <p className="mb-4 text-sm text-gray-600">
          Auto-generated reports compare the current period against the prior
          one and highlight the largest movers.
        </p>
        <div className="flex flex-wrap gap-3">
          {(["weekly", "monthly", "quarterly"] as const).map((p) => (
            <Link
              key={p}
              href={`/admin/reports/${p}`}
              className="rounded px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "#1a3c5f" }}
            >
              Generate {p.charAt(0).toUpperCase() + p.slice(1)} Report
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Recent Reports</h2>
        {recentReports.length === 0 ? (
          <p className="text-sm text-gray-500">
            No reports generated yet this session.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {recentReports
              .slice(-10)
              .reverse()
              .map((r, i) => (
                <li key={i} className="flex justify-between border-b py-1">
                  <Link
                    href={`/admin/reports/${r.period}`}
                    className="hover:underline"
                    style={{ color: "#1a3c5f" }}
                  >
                    {r.period} report
                  </Link>
                  <span className="text-gray-500">
                    {r.generatedAt.toISOString().slice(0, 19).replace("T", " ")}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function logReport(period: string) {
  recentReports.push({ period, generatedAt: new Date() });
}
void logReport;
