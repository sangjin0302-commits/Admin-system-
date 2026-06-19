import Link from "next/link";

import { Card } from "@/components/ui/card";
import { listTemplates } from "@/lib/services/email-template-service";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const templates = await listTemplates();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Settings</p>
        <h1 className="mt-2 ui-page-title">이메일 템플릿</h1>
        <p className="mt-2 text-sm text-text-muted">
          시스템 자동 발송 메일 템플릿을 관리합니다. 변수는{" "}
          <code className="rounded bg-surface-muted px-1">{`{{var}}`}</code> 형식으로
          사용합니다.
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((t) => (
          <Card key={t.key} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-mono text-text-muted">{t.key}</p>
                <h3 className="mt-1 text-sm font-semibold text-text-strong">
                  {t.subject}
                </h3>
                <p className="mt-2 text-xs text-text-muted">
                  변수: {t.variables.map((v) => `{{${v}}}`).join(", ")}
                </p>
              </div>
              <Link
                href={`/admin/email-templates/${t.key}`}
                className="shrink-0 rounded-md border border-line bg-surface px-3 py-1 text-xs font-medium text-text-strong transition hover:bg-surface-muted"
              >
                편집
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
