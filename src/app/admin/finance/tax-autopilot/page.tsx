import { getRecentReports, getTaxAutopilotConfig } from "@/lib/services/tax-report-autopilot";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";

function krw(n: number): string {
  return `${n.toLocaleString()}원`;
}

export default async function TaxAutopilotAdminPage() {
  const [reports, cfg, flagOn] = await Promise.all([
    getRecentReports(24),
    getTaxAutopilotConfig(),
    isFeatureEnabled("tax_report_autopilot"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="ui-kicker">Finance / Automation</p>
        <h1 className="ui-page-title">자동 세금 신고 봇</h1>
        <p className="mt-2 text-sm text-text-muted">
          월 1일 03시 자동 생성 (플래그: {flagOn ? "ON" : "OFF"}) · 자동 제출 임계: {krw(cfg.autoSubmitThresholdKrw)}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-strong">설정</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-text-muted">자동 제출 임계</dt>
            <dd className="font-semibold">{krw(cfg.autoSubmitThresholdKrw)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">예상 경비율</dt>
            <dd className="font-semibold">{Math.round(cfg.incomeExpenseRatio * 100)}%</dd>
          </div>
          <div>
            <dt className="text-text-muted">예상 소득세율</dt>
            <dd className="font-semibold">{Math.round(cfg.incomeTaxRate * 100)}%</dd>
          </div>
          <div>
            <dt className="text-text-muted">알림 이메일</dt>
            <dd className="font-semibold">{cfg.notifyEmail ?? "미설정"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold text-text-strong">최근 자동 생성 리포트 ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">아직 생성된 리포트가 없습니다. 수동 트리거: POST /api/admin/finance/tax-autopilot/run</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-lg border border-line bg-surface-muted p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text-strong">
                    {r.year}년 {r.month}월 신고 초안
                  </p>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                      r.approvalStatus === "approved"
                        ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                        : r.approvalStatus === "rejected"
                          ? "border-red-300 bg-red-100 text-red-800"
                          : "border-amber-300 bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.approvalStatus === "approved" ? "승인" : r.approvalStatus === "rejected" ? "반려" : "대기"}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-text-muted">매출 합계</dt>
                    <dd className="font-semibold">{krw(r.vatDraft.totalSales)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">부가세 매출세액</dt>
                    <dd className="font-semibold">{krw(r.vatDraft.outputVat)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">종합소득세 예상</dt>
                    <dd className="font-semibold">{krw(r.incomeDraft.estimatedIncomeTax)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">발행 건수</dt>
                    <dd className="font-semibold">{r.vatDraft.invoiceCount}건</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-text-muted">
                  {r.submission.autoSubmitted ? "hometax 큐 자동 제출" : r.submission.queuedForManual ? "수동 대기열" : "미제출"} · {r.submission.note}
                </p>
                <p className="mt-1 text-xs text-text-muted">생성 {new Date(r.generatedAt).toLocaleString()}</p>
                {r.approvalStatus === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <form action="/api/admin/finance/tax-autopilot/run" method="post">
                      <input type="hidden" name="reportId" value={r.id} />
                      <input type="hidden" name="action" value="approve" />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded-md border border-emerald-300 bg-emerald-100 px-3 text-xs font-medium text-emerald-800 transition hover:bg-emerald-200"
                      >
                        승인
                      </button>
                    </form>
                    <form action="/api/admin/finance/tax-autopilot/run" method="post">
                      <input type="hidden" name="reportId" value={r.id} />
                      <input type="hidden" name="action" value="reject" />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded-md border border-line bg-surface px-3 text-xs font-medium text-text-muted transition hover:bg-surface-muted"
                      >
                        반려
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
