import { Card } from "@/components/ui/card";
import {
  analyzeIndexes,
  getDbSize,
  getSlowQueryHints
} from "@/lib/services/db-perf-service";

export const dynamic = "force-dynamic";

export default async function AdminDbPerfPage() {
  const [report, dbSize] = await Promise.all([analyzeIndexes(), getDbSize()]);
  const hints = getSlowQueryHints();

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">성능</div>
        <h1 className="ui-page-title">DB 성능 분석</h1>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-3">테이블별 행 수</h2>
        <ul className="text-sm space-y-1">
          {dbSize.tables.map((t) => (
            <li key={t.name} className="flex justify-between border-b py-1">
              <span className="font-mono">{t.name}</span>
              <span>{t.rowCount < 0 ? "n/a" : t.rowCount.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">기존 인덱스</h2>
        <ul className="text-sm space-y-1">
          {report.existingIndexes.map((idx) => (
            <li key={idx} className="font-mono">
              {idx}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">권장 사항</h2>
        <ul className="space-y-3">
          {report.recommendations.map((r, i) => (
            <li key={i} className="border-l-2 border-primary pl-3">
              <div className="text-sm font-mono">
                {r.table} ({r.columns.join(", ")})
              </div>
              <div className="text-xs text-muted-foreground">{r.reason}</div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">주요 쿼리 패턴</h2>
        <ul className="space-y-2">
          {report.queryPatterns.map((p) => (
            <li key={p.name}>
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs font-mono text-muted-foreground">
                {p.description}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">느린 쿼리 개선 힌트</h2>
        <ul className="space-y-2 text-sm">
          {hints.map((h, i) => (
            <li key={i}>
              <span className="font-mono">{h.table}:</span>{" "}
              <span className="text-muted-foreground">{h.suggestion}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
