import { EasylawPanel } from "@/components/admin/easylaw-panel";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

export default async function AdminEasylawPage() {
  const enabled = await isFeatureEnabled("admin_easylaw");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">생활법령 정보</h1>
        <p className="text-sm text-gray-500 mt-1">
          생활법령정보(easylaw.go.kr) API로 생활분야별 법령·판례·재결례를 조회합니다.
        </p>
      </div>
      {enabled ? (
        <EasylawPanel />
      ) : (
        <div className="admin-card p-4 text-sm text-gray-500">
          생활법령정보 조회 기능이 비활성화되어 있습니다.
        </div>
      )}
    </div>
  );
}
