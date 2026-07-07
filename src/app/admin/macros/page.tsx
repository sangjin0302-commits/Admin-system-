import { MacrosManagementClient } from "./macros-management-client";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { listMacros } from "@/lib/services/macro-service";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminMacrosPage() {
  const enabled = await isFeatureEnabled("macro_system");
  if (!enabled) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-strong">매크로 시스템</h2>
        <p className="mt-2 text-sm text-text-muted">
          매크로 시스템 기능이 비활성화되어 있습니다. 관리자에서 <code>macro_system</code> 플래그를 켜주세요.
        </p>
      </Card>
    );
  }
  const macros = await listMacros();
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <p className="ui-kicker">매크로</p>
        <h2 className="mt-2 text-2xl font-semibold text-text-strong">매크로 관리</h2>
        <p className="mt-2 text-sm text-text-muted">
          자주 쓰는 액션 시퀀스를 등록하고 필요할 때 원클릭·단축키로 실행합니다.
        </p>
      </Card>
      <MacrosManagementClient initialMacros={macros} />
    </div>
  );
}
