import { Card } from "@/components/ui/card";

import { WebhookTestButton } from "./webhook-test-button";

export const dynamic = "force-dynamic";

function getSlackStatus() {
  return Boolean(process.env.SLACK_WEBHOOK_URL?.trim());
}

function getTelegramStatus() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      process.env.TELEGRAM_CHAT_ID?.trim(),
  );
}

type StatusTone = "success" | "danger";

const toneClassMap: Record<StatusTone, string> = {
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
};

function StatusBadge({ ok }: { ok: boolean }) {
  const tone: StatusTone = ok ? "success" : "danger";
  return (
    <span className={`ui-status-pill ${toneClassMap[tone]}`}>
      {ok ? "연결됨" : "미연결"}
    </span>
  );
}

export default function AdminWebhooksPage() {
  const slackOk = getSlackStatus();
  const telegramOk = getTelegramStatus();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="ui-analysis-hero p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="ui-kicker">알림 센터</p>
            <h2 className="mt-2 ui-page-title">웹훅 알림 설정</h2>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              Slack 또는 Telegram으로 실시간 알림을 받을 수 있습니다. 사건 상태
              변경, 새 문의 접수 등 주요 이벤트가 발생하면 자동으로
              전송됩니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              Slack <StatusBadge ok={slackOk} />
            </span>
            <span className="flex items-center gap-1.5">
              Telegram <StatusBadge ok={telegramOk} />
            </span>
          </div>
        </div>
        <div className="mt-5">
          <WebhookTestButton disabled={!slackOk && !telegramOk} />
        </div>
      </Card>

      {/* Channel cards */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Slack */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ui-kicker">Slack</p>
              <h3 className="mt-2 ui-section-title">Incoming Webhook</h3>
            </div>
            <StatusBadge ok={slackOk} />
          </div>
          <div className="mt-4 space-y-2 text-sm text-text-muted">
            <p className="font-medium text-text-strong">설정 방법</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>
                Slack 앱 관리에서{" "}
                <span className="font-medium">Incoming Webhooks</span> 활성화
              </li>
              <li>알림 받을 채널 선택 후 Webhook URL 복사</li>
              <li>
                <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
                  SLACK_WEBHOOK_URL
                </code>{" "}
                환경변수에 URL 설정
              </li>
            </ol>
          </div>
        </Card>

        {/* Telegram */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ui-kicker">Telegram</p>
              <h3 className="mt-2 ui-section-title">Bot API</h3>
            </div>
            <StatusBadge ok={telegramOk} />
          </div>
          <div className="mt-4 space-y-2 text-sm text-text-muted">
            <p className="font-medium text-text-strong">설정 방법</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>
                <span className="font-medium">@BotFather</span>에서 봇 생성 후
                토큰 복사
              </li>
              <li>봇을 알림 받을 채널/그룹에 추가</li>
              <li>
                <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
                  TELEGRAM_BOT_TOKEN
                </code>{" "}
                환경변수에 토큰 설정
              </li>
              <li>
                <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
                  TELEGRAM_CHAT_ID
                </code>{" "}
                환경변수에 채팅 ID 설정
              </li>
            </ol>
          </div>
        </Card>
      </div>

      {/* Supported events */}
      <Card className="p-6">
        <p className="ui-kicker">지원 이벤트</p>
        <h3 className="mt-2 ui-section-title">자동 전송되는 알림 목록</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { code: "case.status_changed", label: "사건 상태 변경" },
            { code: "inquiry.created", label: "새 문의 접수" },
            { code: "webhook.test", label: "테스트 알림" },
          ].map((evt) => (
            <Card key={evt.code} muted className="p-4">
              <p className="text-sm font-semibold text-text-strong">
                {evt.label}
              </p>
              <code className="mt-1 block text-xs text-text-muted">
                {evt.code}
              </code>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
