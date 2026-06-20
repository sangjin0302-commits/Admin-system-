import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { cacheStats } from "@/lib/services/cache-service";
import { getRateLimitStats } from "@/lib/services/rate-limiter";

export const dynamic = "force-dynamic";

export default function LawbotStatsPage() {
  const cache = cacheStats();
  const rl = getRateLimitStats();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Bot Usage"
        title="Lawbot 사용 통계"
        description="법령 챗봇 사용량, tier별 분포, 캐시 히트율 등을 확인합니다."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs text-text-muted">활성 IP/사용자</p>
          <p className="mt-1 text-2xl font-bold text-text-strong">{rl.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-text-muted">캐시 항목</p>
          <p className="mt-1 text-2xl font-bold text-text-strong">{cache.entries}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-text-muted">캐시 히트율</p>
          <p className="mt-1 text-2xl font-bold text-text-strong">
            {(cache.hitRate * 100).toFixed(1)}%
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-text-strong">Tier 기능 매트릭스</h3>
        <table className="mt-3 w-full text-xs">
          <thead className="bg-surface-muted">
            <tr>
              <th className="px-3 py-2 text-left text-text-muted">Tier</th>
              <th className="px-3 py-2 text-left text-text-muted">일일 한도</th>
              <th className="px-3 py-2 text-left text-text-muted">답변 길이</th>
              <th className="px-3 py-2 text-left text-text-muted">대화 연속</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr><td className="px-3 py-2">익명</td><td className="px-3 py-2">5회</td><td className="px-3 py-2">500자</td><td className="px-3 py-2">X</td></tr>
            <tr><td className="px-3 py-2">가입자</td><td className="px-3 py-2">30회</td><td className="px-3 py-2">2000자</td><td className="px-3 py-2">O</td></tr>
            <tr><td className="px-3 py-2">유료 고객</td><td className="px-3 py-2">무제한</td><td className="px-3 py-2">무제한</td><td className="px-3 py-2">O · 사건 컨텍스트</td></tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
