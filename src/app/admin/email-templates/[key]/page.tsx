import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { DEFAULT_TEMPLATES, getTemplate } from "@/lib/services/email-template-service";
import { TemplateEditor } from "./template-editor";

export const dynamic = "force-dynamic";

export default async function EmailTemplateEditorPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!DEFAULT_TEMPLATES[key]) {
    notFound();
  }
  const template = await getTemplate(key);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Settings</p>
        <h1 className="mt-2 ui-page-title">템플릿 편집: {template.key}</h1>
        <p className="mt-2 text-sm text-text-muted">
          <Link href="/admin/email-templates" className="underline">
            ← 목록으로
          </Link>
        </p>
      </Card>

      <Card className="p-5">
        <TemplateEditor
          templateKey={template.key}
          initialSubject={template.subject}
          initialBodyHtml={template.bodyHtml}
          variables={template.variables}
        />
      </Card>
    </div>
  );
}
