import { Card } from "@/components/ui/card";

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Integrations</p>
        <h3 className="mt-2 ui-section-title">웹훅 설정</h3>
        <p className="mt-2 text-sm text-text-muted">
          외부 시스템과 연동하기 위한 웹훅 엔드포인트를 관리합니다.
        </p>
      </Card>

      <Card className="p-6">
        <h4 className="text-sm font-semibold text-text-strong">지원 이벤트</h4>
        <div className="mt-4 space-y-2">
          {[
            { event: "inquiry.created", desc: "새 문의 접수 시" },
            { event: "inquiry.status_changed", desc: "문의 상태 변경 시" },
            { event: "case.created", desc: "새 사건 생성 시" },
            { event: "case.updated", desc: "사건 업데이트 시" },
            { event: "payment.confirmed", desc: "결제 확인 시" },
            { event: "document.signed", desc: "문서 서명 완료 시" },
          ].map(({ event, desc }) => (
            <div key={event} className="flex items-center justify-between rounded-lg border border-line px-4 py-3">
              <div>
                <code className="text-xs font-semibold text-primary">{event}</code>
                <p className="mt-0.5 text-xs text-text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-sm font-semibold text-text-strong">Slack 연동</h4>
        <p className="mt-2 text-sm text-text-muted">
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">SLACK_WEBHOOK_URL</code> 환경 변수를 설정하면
          모든 이벤트가 Slack 채널로 자동 전송됩니다.
        </p>
        <div className="mt-3 rounded-lg border border-line bg-surface-muted px-4 py-3">
          <p className="text-xs text-text-muted">
            현재 상태:{" "}
            <span className="font-semibold">
              {process.env.SLACK_WEBHOOK_URL ? "✅ 연결됨" : "❌ 미설정"}
            </span>
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-sm font-semibold text-text-strong">페이로드 형식</h4>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-muted p-4 text-xs text-text">
{`POST /your-endpoint
Content-Type: application/json
X-Webhook-Signature: <HMAC-SHA256 hex> (if secret configured)

{
  "event": "inquiry.created",
  "data": { "id": "...", "name": "...", "category": "..." },
  "timestamp": "2024-01-01T00:00:00.000Z"
}`}
        </pre>
      </Card>
    </div>
  );
}
