import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

function getTossStatus() {
  return Boolean(process.env.TOSS_SECRET_KEY?.trim());
}

const MOCK_PAYMENTS = [
  { orderId: "ORD-2025-001", orderName: "비자 수수료", amount: 350000, status: "성공", date: "2025-06-15" },
  { orderId: "ORD-2025-002", orderName: "번역 공증비", amount: 120000, status: "성공", date: "2025-06-14" },
  { orderId: "ORD-2025-003", orderName: "착수금", amount: 500000, status: "실패", date: "2025-06-13" },
];

export default function PaymentsPage() {
  const connected = getTossStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        kicker="Finance"
        title="결제 관리"
        description="토스페이먼츠를 통한 결제 연동 현황과 최근 결제 내역을 확인합니다."
      />

      {/* Integration status */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">연동 상태</h3>
        <div className="mt-4 flex items-center gap-3">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              connected ? "bg-emerald-500" : "bg-gray-300"
            }`}
          />
          <span className="text-sm text-text-muted">
            TOSS_SECRET_KEY — {connected ? "설정됨" : "미설정 (개발 모드)"}
          </span>
        </div>
      </Card>

      {/* Recent payments */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-line px-5 py-4">
          <h3 className="text-sm font-semibold text-text-strong">
            최근 결제 {!connected && <span className="font-normal text-text-muted">(샘플 데이터)</span>}
          </h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs font-semibold text-text-muted">
            <tr>
              <th className="px-5 py-3">주문번호</th>
              <th className="px-5 py-3">상품명</th>
              <th className="px-5 py-3 text-right">금액</th>
              <th className="px-5 py-3">상태</th>
              <th className="px-5 py-3">일자</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {MOCK_PAYMENTS.map((p) => (
              <tr key={p.orderId}>
                <td className="px-5 py-3 font-mono text-xs text-text-muted">{p.orderId}</td>
                <td className="px-5 py-3 text-text-strong">{p.orderName}</td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {p.amount.toLocaleString("ko-KR")}원
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.status === "성공"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-text-muted">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Setup instructions */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-text-strong">토스페이먼츠 설정 방법</h3>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-text-muted">
          <li>
            <a
              href="https://developers.tosspayments.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              토스페이먼츠 개발자 센터
            </a>
            에서 가맹점을 등록합니다.
          </li>
          <li>테스트/라이브 시크릿 키를 발급받습니다.</li>
          <li>
            환경 변수{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
              TOSS_SECRET_KEY
            </code>
            를 설정합니다.
          </li>
          <li>결제 위젯 또는 API 연동을 구현합니다.</li>
        </ol>
      </Card>
    </div>
  );
}
