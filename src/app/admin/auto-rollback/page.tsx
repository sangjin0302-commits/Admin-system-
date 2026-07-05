import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getErrorBuckets,
  getRollbackConfig,
  getRollbackEvents,
} from "@/lib/services/auto-rollback-service";

export const dynamic = "force-dynamic";

export default async function AutoRollbackPage() {
  const [config, events, buckets] = await Promise.all([
    getRollbackConfig(),
    getRollbackEvents(),
    getErrorBuckets(),
  ]);
  const latestBuckets = buckets.slice(-12);
  const maxCount = Math.max(1, ...latestBuckets.map((b) => b.count));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="안정성"
        title="자동 롤백"
        description="오류율 급증 감지 시 최근 활성화된 플래그·카나리를 자동 복구합니다."
      />

      <Card className="p-5">
        <h2 className="text-sm font-semibold">임계값 설정</h2>
        <form action="/api/admin/auto-rollback" method="post" className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="action" value="config" />
          <label className="text-xs">
            <span className="block text-text-muted">Spike 배수</span>
            <input
              name="errorSpikeMultiplier"
              type="number"
              step="0.1"
              defaultValue={config.errorSpikeMultiplier}
              className="mt-1 w-24 rounded border border-line px-2 py-1"
            />
          </label>
          <label className="text-xs">
            <span className="block text-text-muted">기준선 버킷 수</span>
            <input
              name="baselineLookbackBuckets"
              type="number"
              defaultValue={config.baselineLookbackBuckets}
              className="mt-1 w-24 rounded border border-line px-2 py-1"
            />
          </label>
          <label className="text-xs">
            <span className="block text-text-muted">최소 절대 카운트</span>
            <input
              name="minAbsoluteCount"
              type="number"
              defaultValue={config.minAbsoluteCount}
              className="mt-1 w-24 rounded border border-line px-2 py-1"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-indigo-600 px-3 py-1 text-sm text-white"
          >
            저장
          </button>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">최근 오류 (5분 버킷)</h2>
        {latestBuckets.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">데이터 없음.</p>
        ) : (
          <div className="mt-3 flex h-24 items-end gap-1">
            {latestBuckets.map((b) => (
              <div
                key={b.bucketStart}
                title={`${new Date(b.bucketStart).toLocaleTimeString("ko-KR")} — ${b.count}`}
                className="flex-1 bg-rose-500"
                style={{ height: `${(b.count / maxCount) * 100}%`, minHeight: 2 }}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">수동 롤백</h2>
        </div>
        <form action="/api/admin/auto-rollback" method="post" className="mt-3 flex gap-2">
          <input type="hidden" name="action" value="manual" />
          <input
            name="reason"
            placeholder="사유"
            className="flex-1 rounded border border-line px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-rose-600 px-3 py-1 text-sm text-white"
          >
            즉시 롤백
          </button>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">롤백 이벤트</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">이력 없음.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-xs">
            {events
              .slice()
              .reverse()
              .slice(0, 20)
              .map((e) => (
                <li key={e.id} className="border-t border-line pt-2">
                  <div className="flex justify-between font-mono text-text-muted">
                    <span>{e.triggeredAt}</span>
                    <span>{e.id}</span>
                  </div>
                  <p className="mt-1">{e.reason}</p>
                  <ul className="mt-1 list-disc pl-4 text-text-muted">
                    {e.actions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
