import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { listCanaryConfigs } from "@/lib/services/canary-rollout-service";

export const dynamic = "force-dynamic";

export default async function CanaryPage() {
  const configs = await listCanaryConfigs();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="배포"
        title="카나리 배포"
        description="사용자 비율 기반 단계적 노출. 해시(userId+flagKey) 배정으로 결정적."
      />

      {configs.length === 0 ? (
        <Card className="p-6 text-sm text-text-muted">
          진행 중인 카나리 배포가 없습니다. POST /api/admin/canary 로 등록.
        </Card>
      ) : (
        <div className="space-y-3">
          {configs.map((c) => (
            <Card key={c.flagKey} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm">{c.flagKey}</p>
                  <p className="text-xs text-text-muted">
                    시작: {new Date(c.startedAt).toLocaleString("ko-KR")} · 갱신:{" "}
                    {new Date(c.updatedAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                {c.paused ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    일시정지
                  </span>
                ) : (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                    진행 중
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-text-muted">
                  <span>현재 {c.currentPercent}%</span>
                  <span>목표 {c.targetPercent}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded bg-line">
                  <div
                    className="h-full bg-indigo-600"
                    style={{ width: `${c.currentPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 10, 50, 100].map((p) => (
                  <form key={p} action="/api/admin/canary" method="post" className="inline">
                    <input type="hidden" name="action" value="advance" />
                    <input type="hidden" name="flagKey" value={c.flagKey} />
                    <input type="hidden" name="newPercent" value={String(p)} />
                    <button
                      type="submit"
                      className="rounded border border-line px-2 py-1 text-xs hover:bg-line/30"
                    >
                      {p}%
                    </button>
                  </form>
                ))}
                <form action="/api/admin/canary" method="post" className="inline">
                  <input type="hidden" name="action" value="pause" />
                  <input type="hidden" name="flagKey" value={c.flagKey} />
                  <button
                    type="submit"
                    className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-800 hover:bg-amber-50"
                  >
                    일시정지
                  </button>
                </form>
                <form action="/api/admin/canary" method="post" className="inline">
                  <input type="hidden" name="action" value="remove" />
                  <input type="hidden" name="flagKey" value={c.flagKey} />
                  <button
                    type="submit"
                    className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                  >
                    제거
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
