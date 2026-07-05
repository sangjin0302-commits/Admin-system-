import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  bulkMigrateStatus,
  getRecentUploads,
  isConfigured,
} from "@/lib/services/cloudflare-images-service";

export const dynamic = "force-dynamic";

export default async function CloudflareImagesPage() {
  const [enabled, recent, migration] = await Promise.all([
    isFeatureEnabled("cloudflare_images"),
    getRecentUploads(),
    bulkMigrateStatus(),
  ]);
  const configured = isConfigured();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Integration"
        title="Cloudflare Images"
        description="이미지 업로드·자동 리사이즈. 미설정 시 원본 URL 그대로 반환합니다."
      />

      {!enabled && (
        <Card className="p-4">
          <p className="text-sm text-warning">
            기능 플래그 <code>cloudflare_images</code>가 꺼져 있습니다. 관리자 &gt; 기능 플래그에서 활성화하세요.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-sm font-semibold">환경 설정</h3>
        <p className="mt-2 text-sm text-text-muted">
          환경변수 <code>CLOUDFLARE_IMAGES_ACCOUNT_ID</code>, <code>CLOUDFLARE_IMAGES_API_TOKEN</code>이 설정되어야 합니다.
        </p>
        <p className="mt-3 text-sm">
          상태: <strong>{configured ? "✅ 설정 완료" : "⚠ 미설정 (fallback 모드)"}</strong>
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold">기존 이미지 CF로 이전</h3>
        <p className="mt-2 text-sm text-text-muted">
          이전 완료: <strong>{migration.migrated}</strong>건 · 대기: <strong>{migration.pending}</strong>건
        </p>
        <p className="mt-3 text-xs text-text-muted">
          실제 마이그레이션은 백그라운드 잡 큐 <code>job_queue</code>로 실행됩니다.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-semibold">최근 업로드</h3>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">최근 업로드가 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {recent.slice(0, 20).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                <span className="truncate">{r.id}</span>
                <span className="text-xs text-text-muted">{new Date(r.uploadedAt).toLocaleString("ko-KR")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
