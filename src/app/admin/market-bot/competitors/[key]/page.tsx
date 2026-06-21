import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { getCompetitorDetail } from "@/lib/services/market-analyze-client";

export const dynamic = "force-dynamic";

export default async function CompetitorDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  let data: any = null;
  let error: string | null = null;
  try {
    data = await getCompetitorDetail(key);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Market"
        title={`경쟁사 상세: ${key}`}
        action={
          <Link href="/admin/market-bot/competitors" className="text-xs text-primary hover:underline">
            ← 목록
          </Link>
        }
      />
      <Card className="p-6">
        {error ? (
          <p className="text-sm text-text-muted">데이터 조회 실패: {error}</p>
        ) : (
          <pre className="overflow-auto text-xs text-text-strong">{JSON.stringify(data, null, 2)}</pre>
        )}
      </Card>
    </div>
  );
}
