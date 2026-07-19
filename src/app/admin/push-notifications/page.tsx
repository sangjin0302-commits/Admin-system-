import { Card } from "@/components/ui/card";
import { getPushHistory } from "@/lib/services/push-notification-service";

import { SendPushForm } from "./send-form";

export const dynamic = "force-dynamic";

export default function AdminPushNotificationsPage() {
  const history = getPushHistory();

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">모바일</div>
        <h1 className="ui-page-title">푸시 알림</h1>
      </div>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">테스트 푸시 발송</h2>
          <SendPushForm />
        </div>
      </Card>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">발송 이력</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              발송된 푸시 알림이 없습니다.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2">발송 시각</th>
                  <th>제목</th>
                  <th>내용</th>
                  <th>성공</th>
                  <th>실패</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2">{h.at.toISOString()}</td>
                    <td>{h.title}</td>
                    <td className="text-muted-foreground">{h.body}</td>
                    <td>{h.sent}</td>
                    <td>{h.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
