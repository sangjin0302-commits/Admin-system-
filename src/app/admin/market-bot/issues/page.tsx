import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getHotIssues } from "@/lib/services/market-analyze-client";

export const dynamic = "force-dynamic";

function pick(obj: any, keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return String(obj[k]);
  }
  return "";
}

export default async function IssuesPage() {
  let items: any[] = [];
  let error: string | null = null;
  try {
    items = await getHotIssues();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader kicker="Market" title="핫이슈" description="market-analyze 핫이슈 전체 목록" />
      <Card className="p-6">
        {error ? (
          <p className="text-sm text-text-muted">데이터 조회 실패: {error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-muted">데이터 없음</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-line bg-surface-muted p-4 text-sm">
                <p className="font-semibold text-text-strong">
                  {pick(item, ["title", "headline", "name", "subject"]) || `#${i + 1}`}
                </p>
                <p className="mt-1 text-xs text-text-muted whitespace-pre-wrap">
                  {pick(item, ["summary", "description", "snippet", "body"]).slice(0, 600)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
