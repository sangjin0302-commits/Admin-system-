import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getCompetitors } from "@/lib/services/market-analyze-client";

export const dynamic = "force-dynamic";

function pick(obj: any, keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return String(obj[k]);
  }
  return "";
}

export default async function CompetitorsPage() {
  let items: any[] = [];
  let error: string | null = null;
  try {
    items = await getCompetitors();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader kicker="Market" title="경쟁사 목록" description="market-analyze에서 추적 중인 경쟁사 전체 목록" />
      <Card className="p-6">
        {error ? (
          <p className="text-sm text-text-muted">데이터 조회 실패: {error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-muted">데이터 없음</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => {
              const key = pick(item, ["key", "id", "slug"]);
              const name = pick(item, ["name", "title", "label"]) || key || `#${i + 1}`;
              const summary = pick(item, ["summary", "description", "tagline"]);
              return (
                <Link
                  key={i}
                  href={key ? `/admin/market-bot/competitors/${encodeURIComponent(key)}` : "#"}
                  className="block rounded-lg border border-line bg-surface-muted p-4 hover:border-primary"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-text-strong">{name}</p>
                    {key && <span className="text-xs text-text-muted">{key}</span>}
                  </div>
                  {summary && <p className="mt-1 text-xs text-text-muted">{summary.slice(0, 240)}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
