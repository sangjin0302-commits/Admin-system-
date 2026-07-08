import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { MacroHotkeysClient } from "./macro-hotkeys-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "매크로 hotkey · ETHOS 관리" };

export default async function MacroHotkeysPage() {
  if (!(await isFeatureEnabled("macro_hotkeys"))) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">매크로 hotkey</h1>
        <p className="mt-1 text-sm text-text-muted">
          <b>Ctrl+1 ~ Ctrl+9</b> 눌러 즉시 삽입 (textarea) 또는 복사 (일반 페이지).
          로컬 저장, 브라우저별 관리.
        </p>
      </div>
      <MacroHotkeysClient />
    </div>
  );
}
