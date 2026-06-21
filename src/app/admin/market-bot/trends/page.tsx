import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getHotTopics, getRisingTrends } from "@/lib/services/market-analyze-client";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

function pick(obj: any, keys: string[]): string {
  if (!obj || typeof obj !== "object") return "";
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return String(obj[k]);
  }
  return "";
}

function List({ items, titleKeys, subKeys }: { items: any[] | null; titleKeys: string[]; subKeys: string[] }) {
  if (!items) return <p className="text-sm text-text-muted">데이터 조회 실패</p>;
  if (items.length === 0) return <p className="text-sm text-text-muted">데이터 없음</p>;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-line bg-surface-muted p-3 text-sm">
          <p className="font-semibold text-text-strong">{pick(item, titleKeys) || `#${i + 1}`}</p>
          <p className="mt-1 text-xs text-text-muted">{pick(item, subKeys).slice(0, 200)}</p>
        </div>
      ))}
    </div>
  );
}

export default async function TrendsPage() {
  const [rising, hot] = await Promise.all([safe(getRisingTrends), safe(getHotTopics)]);
  return (
    <div className="space-y-6">
      <AdminPageHeader kicker="Market" title="트렌드 분석" description="부상 트렌드 및 핫토픽 전체 목록" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="ui-section-title">부상 트렌드</h3>
          <div className="mt-4">
            <List items={rising} titleKeys={["keyword", "term", "title", "name"]} subKeys={["score", "growth", "change", "summary"]} />
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="ui-section-title">핫토픽</h3>
          <div className="mt-4">
            <List items={hot} titleKeys={["title", "topic", "name", "keyword"]} subKeys={["summary", "description", "count", "score"]} />
          </div>
        </Card>
      </div>
    </div>
  );
}
