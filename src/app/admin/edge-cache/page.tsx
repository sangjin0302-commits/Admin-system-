import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  CACHEABLE_PUBLIC_PATHS,
  getRevalidationLog,
} from "@/lib/services/edge-cache-service";
import { EdgeCacheClient } from "./edge-cache-client";

export const dynamic = "force-dynamic";

export default async function EdgeCachePage() {
  const [enabled, log] = await Promise.all([
    isFeatureEnabled("edge_cache_optimization"),
    getRevalidationLog(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Performance"
        title="글로벌 CDN 캐싱"
        description="Vercel Edge 캐시 헤더·경로 재검증. 정적 페이지는 장시간 캐싱, 관리자 페이지는 no-store."
      />

      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">
            기능 플래그 <code>edge_cache_optimization</code>가 꺼져 있습니다.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">캐시 가능 공개 경로</h3>
          <EdgeCacheClient />
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {CACHEABLE_PUBLIC_PATHS.map((p) => (
            <li key={p.path} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
              <span className="font-mono text-xs">{p.path}</span>
              <span className="text-xs text-text-muted">
                {p.preset} · {p.note ?? ""}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold">최근 재검증 로그</h3>
        {log.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">기록이 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {log.slice(0, 30).map((e, i) => (
              <li key={`${e.at}-${i}`} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                <span className="font-mono text-xs">{e.path}</span>
                <span className="text-xs text-text-muted">
                  {e.reason ?? ""} · {new Date(e.at).toLocaleString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold">Cache Hit Rate</h3>
        <p className="mt-3 text-sm text-text-muted">
          정확한 캐시 적중률은 Vercel Analytics 대시보드에서 확인하세요.
          <br />
          자체 추정: 재검증 로그가 적을수록 (경로별 &lt; 1회/시간) 적중률이 높습니다.
        </p>
      </Card>
    </div>
  );
}
