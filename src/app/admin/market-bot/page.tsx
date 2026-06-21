import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import {
  getApiHealth,
  getCompetitors,
  getDataHealth,
  getHotIssues,
  getMetricsReports,
  getRisingTrends,
} from "@/lib/services/market-analyze-client";
import { QuickSyncActions } from "./sync/sync-controls";

export const dynamic = "force-dynamic";

async function safeCall<T>(
  fn: () => Promise<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function pickField(obj: any, keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return String(obj[k]);
  }
  return "";
}

export default async function AdminMarketBotPage() {
  const [health, dataHealth, metrics, issues, trends, competitors] = await Promise.all([
    safeCall(getApiHealth),
    safeCall(getDataHealth),
    safeCall(getMetricsReports),
    safeCall(getHotIssues),
    safeCall(getRisingTrends),
    safeCall(getCompetitors),
  ]);

  const apiOk = health.ok;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Market Intelligence"
        title="마켓 분석 대시보드"
        description="market-analyze API에서 수집한 시장·경쟁사·트렌드 데이터를 종합 조회합니다."
        action={
          <span
            className={
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold " +
              (apiOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")
            }
          >
            <span className={"h-2 w-2 rounded-full " + (apiOk ? "bg-green-500" : "bg-red-500")} />
            {apiOk ? "API 정상" : "API 연결 실패"}
          </span>
        }
      />

      {!apiOk && (
        <Card className="border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Market Analyze API에 연결할 수 없습니다.</p>
          <p className="mt-1">
            환경변수 <code>MARKET_BOT_API_URL</code>, <code>MARKET_BOT_ADMIN_TOKEN</code> 설정을 확인하세요.
          </p>
          <p className="mt-1 text-xs opacity-80">{health.ok ? "" : health.error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="ui-kicker">API 상태</p>
          <p className="mt-2 text-2xl font-bold text-text-strong">
            {health.ok ? (health.data?.status ?? "ok") : "DOWN"}
          </p>
          <p className="mt-1 text-xs text-text-muted">/health</p>
        </Card>
        <Card className="p-5">
          <p className="ui-kicker">데이터 신선도</p>
          {dataHealth.ok ? (
            <pre className="mt-2 max-h-24 overflow-auto text-xs text-text-strong">
              {JSON.stringify(dataHealth.data, null, 2).slice(0, 400)}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-text-muted">데이터 조회 실패</p>
          )}
        </Card>
        <Card className="p-5">
          <p className="ui-kicker">최근 동기화</p>
          {metrics.ok ? (
            <pre className="mt-2 max-h-24 overflow-auto text-xs text-text-strong">
              {JSON.stringify(metrics.data, null, 2).slice(0, 400)}
            </pre>
          ) : (
            <p className="mt-2 text-sm text-text-muted">데이터 조회 실패</p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="ui-section-title">핫이슈</h3>
          <Link href="/admin/market-bot/issues" className="text-xs text-primary hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {issues.ok ? (
            issues.data.length === 0 ? (
              <p className="text-sm text-text-muted">데이터 없음</p>
            ) : (
              issues.data.slice(0, 5).map((item, i) => (
                <div key={i} className="rounded-lg border border-line bg-surface-muted p-3 text-sm">
                  <p className="font-semibold text-text-strong">
                    {pickField(item, ["title", "name", "headline", "subject"]) || `#${i + 1}`}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {pickField(item, ["summary", "description", "snippet", "body"]).slice(0, 200)}
                  </p>
                </div>
              ))
            )
          ) : (
            <p className="text-sm text-text-muted">데이터 조회 실패: {issues.error}</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="ui-section-title">부상 트렌드</h3>
          <Link href="/admin/market-bot/trends" className="text-xs text-primary hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {trends.ok ? (
            trends.data.length === 0 ? (
              <p className="text-sm text-text-muted">데이터 없음</p>
            ) : (
              trends.data.slice(0, 5).map((item, i) => (
                <div key={i} className="rounded-lg border border-line bg-surface-muted p-3 text-sm">
                  <p className="font-semibold text-text-strong">
                    {pickField(item, ["keyword", "term", "title", "name"]) || `#${i + 1}`}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {pickField(item, ["score", "growth", "change", "summary"])}
                  </p>
                </div>
              ))
            )
          ) : (
            <p className="text-sm text-text-muted">데이터 조회 실패: {trends.error}</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="ui-section-title">경쟁사</h3>
          <Link href="/admin/market-bot/competitors" className="text-xs text-primary hover:underline">
            전체 보기 →
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {competitors.ok ? (
            competitors.data.length === 0 ? (
              <p className="text-sm text-text-muted">데이터 없음</p>
            ) : (
              competitors.data.slice(0, 5).map((item, i) => {
                const key = pickField(item, ["key", "id", "slug"]);
                const name = pickField(item, ["name", "title", "label"]) || key || `#${i + 1}`;
                return (
                  <Link
                    key={i}
                    href={
                      key
                        ? `/admin/market-bot/competitors/${encodeURIComponent(key)}`
                        : "/admin/market-bot/competitors"
                    }
                    className="block rounded-lg border border-line bg-surface-muted p-3 text-sm hover:border-primary"
                  >
                    <p className="font-semibold text-text-strong">{name}</p>
                    {key && <p className="mt-1 text-xs text-text-muted">{key}</p>}
                  </Link>
                );
              })
            )
          ) : (
            <p className="text-sm text-text-muted">데이터 조회 실패: {competitors.error}</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="ui-section-title">빠른 작업</h3>
        <p className="mt-1 text-xs text-text-muted">
          상세 동기화:{" "}
          <Link href="/admin/market-bot/sync" className="text-primary hover:underline">
            /admin/market-bot/sync
          </Link>
          {" · "}
          리포트:{" "}
          <Link href="/admin/market-bot/reports" className="text-primary hover:underline">
            /admin/market-bot/reports
          </Link>
        </p>
        <div className="mt-4">
          <QuickSyncActions />
        </div>
      </Card>
    </div>
  );
}
