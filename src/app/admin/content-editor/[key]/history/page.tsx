import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getContent, getContentHistory } from "@/lib/services/site-content-service";
import { isValidContentKey, CONTENT_KEYS } from "@/lib/services/site-content-keys";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { HistoryRollbackClient } from "./history-rollback-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "편집 히스토리 — 관리자" };

export default async function ContentHistoryPage({
  params
}: {
  params: Promise<{ key: string }>;
}) {
  const { key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);

  const enabled = await isFeatureEnabled("cms_history");
  if (!enabled) {
    return (
      <Card className="p-6">
        <h1 className="ui-page-title">히스토리 비활성</h1>
        <p className="mt-2 text-sm text-text-muted">
          <code className="rounded bg-line/40 px-1">cms_history</code> flag를 켜세요.
        </p>
      </Card>
    );
  }

  if (!isValidContentKey(key)) {
    return (
      <Card className="p-6">
        <h1 className="ui-page-title">알 수 없는 키</h1>
        <p className="mt-2 text-sm text-text-muted">
          <code>{key}</code>
        </p>
        <Link href="/admin/content-editor" className="text-xs underline">← 편집기</Link>
      </Card>
    );
  }

  const meta = CONTENT_KEYS.find((c) => c.key === key);
  const current = await getContent(key);
  const history = await getContentHistory(key);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Content History</p>
        <h1 className="mt-2 ui-page-title">{meta?.label ?? key}</h1>
        <p className="mt-1 text-xs text-text-muted">
          <code className="rounded bg-line/30 px-1">{key}</code> · 최근 {history.length}건 (최대 10)
        </p>
        <div className="mt-3">
          <Link href="/admin/content-editor" className="text-xs underline">← 편집기로 돌아가기</Link>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-text-strong">현재 값</h2>
        <pre className="mt-2 whitespace-pre-wrap rounded border border-line bg-surface p-3 text-xs text-text-strong">
{current}
        </pre>
      </Card>

      <HistoryRollbackClient
        contentKey={key}
        currentValue={current}
        history={history}
      />
    </div>
  );
}
