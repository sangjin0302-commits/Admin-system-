import Link from "next/link";

import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

// In-memory recent reports log (resets on server restart).
type RecentReport = { period: string; generatedAt: Date };
const globalAny = globalThis as unknown as { __recentReports?: RecentReport[] };
const recentReports: RecentReport[] = globalAny.__recentReports ?? [];
globalAny.__recentReports = recentReports;

const PERIOD_LABELS: Record<string, string> = {
  weekly: "주간",
  monthly: "월간",
  quarterly: "분기",
};

export default async function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">보고서</div>
        <h1 className="ui-page-title">경영 보고서</h1>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">새 보고서 생성</h2>
        <p className="mb-4 text-sm text-gray-600">
          자동 생성 보고서는 현재 기간과 직전 기간을 비교하여 변동 폭이 큰
          항목을 짚어 줍니다.
        </p>
        <div className="flex flex-wrap gap-3">
          {(["weekly", "monthly", "quarterly"] as const).map((p) => (
            <Link
              key={p}
              href={`/admin/reports/${p}`}
              className="rounded px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "#1a3c5f" }}
            >
              {PERIOD_LABELS[p]} 보고서 생성
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">최근 보고서</h2>
        {recentReports.length === 0 ? (
          <p className="text-sm text-gray-500">
            생성 이력을 아직 저장하지 않습니다. 위에서 기간을 선택해 보고서를 여세요.
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
                    {PERIOD_LABELS[r.period] ?? r.period} 보고서
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

// NOTE: 예전에는 여기에 logReport() 가 있었지만 어디서도 호출되지 않았고
// `void logReport;` 로 미사용 경고만 눌러둔 상태였다. 그래서 recentReports 는
// 영원히 비어 있었고 "최근 보고서" 목록도 항상 빈 채로 남았다.
// 기록을 실제로 남기려면 서버리스에서 인스턴스마다 초기화되는 인메모리 배열이
// 아니라 DB(예: SiteSetting 또는 전용 테이블)에 적어야 한다.
