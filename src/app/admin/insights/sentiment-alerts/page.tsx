import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  DEESCALATION_TEMPLATES,
  listAtRiskInquiries,
} from "@/lib/services/sentiment-analysis-service";

export const dynamic = "force-dynamic";

const SENTIMENT_STYLE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-300",
  negative: "bg-amber-100 text-amber-800 border-amber-300",
};

export default async function SentimentAlertsPage() {
  const enabled = await isFeatureEnabled("sentiment_analysis");
  if (!enabled) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminPageHeader kicker="Insights" title="감정 위험 알림" description="기능이 비활성화되어 있습니다." />
        <Card className="p-6 text-sm text-text-muted">기능 플래그 `sentiment_analysis`를 활성화하세요.</Card>
      </div>
    );
  }
  const alerts = await listAtRiskInquiries(7);
  const critical = alerts.filter((a) => a.sentiment === "critical");
  const negative = alerts.filter((a) => a.sentiment === "negative");

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminPageHeader
        kicker="Insights"
        title="감정 위험 알림"
        description="최근 7일간 감지된 부정·심각 감정 문의. 담당자 즉시 확인 필요."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-text-muted">Critical</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{critical.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">Negative</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{negative.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted">총 위험</p>
          <p className="mt-1 text-2xl font-bold">{alerts.length}</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">위험 문의 리스트</h2>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">위험 감지된 문의가 없습니다.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-text-muted">
                  <th className="py-2 pr-3">감정</th>
                  <th className="py-2 pr-3">고객</th>
                  <th className="py-2 pr-3">제목</th>
                  <th className="py-2 pr-3">위험 요인</th>
                  <th className="py-2 pr-3">제안 조치</th>
                  <th className="py-2 pr-3">분석 시각</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.inquiryId} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded border px-2 py-0.5 text-xs ${SENTIMENT_STYLE[a.sentiment] ?? ""}`}
                      >
                        {a.sentiment}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <div>{a.contactName}</div>
                      <div className="text-xs text-text-muted">{a.email}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <Link href={`/admin/inquiries/${a.inquiryId}`} className="text-primary underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-xs">{a.riskFactors.join(", ")}</td>
                    <td className="py-2 pr-3 text-xs">{a.suggestedAction}</td>
                    <td className="py-2 pr-3 text-xs text-text-muted">
                      {new Date(a.analyzedAt).toLocaleString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">긴급 대응 스크립트</h2>
        <p className="mt-1 text-xs text-text-muted">복사 후 채널에 즉시 회신하세요.</p>
        <div className="mt-3 space-y-3">
          {DEESCALATION_TEMPLATES.map((t) => (
            <div key={t.id} className="rounded border p-3 text-sm">
              <p className="font-medium">{t.label}</p>
              <pre className="mt-1 whitespace-pre-wrap break-words text-xs text-text-muted">{t.body}</pre>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
