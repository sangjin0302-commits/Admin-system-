import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getEditorEmails } from "@/lib/services/site-content-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { EditorPermissionsClient } from "./editor-permissions-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "편집 권한 관리 — 관리자" };

export default async function EditorPermissionsPage() {
  const enabled = await isFeatureEnabled("cms_editor_role");
  const emails = await getEditorEmails();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Content CMS</p>
        <h1 className="mt-2 ui-page-title">편집 권한 관리</h1>
        <p className="mt-2 text-sm text-text-muted">
          SUPER·MANAGER 외에 콘텐츠 편집을 허용할 이메일 목록입니다.
        </p>
        {!enabled && (
          <p className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800">
            <code className="rounded bg-line/40 px-1">cms_editor_role</code> flag가 꺼져 있습니다.
            <Link href="/admin/features" className="ml-1 underline">기능 플래그</Link>에서 활성화하세요.
          </p>
        )}
      </Card>

      <EditorPermissionsClient initialEmails={emails} />
    </div>
  );
}
