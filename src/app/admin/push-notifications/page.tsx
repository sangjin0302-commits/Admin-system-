import { Card } from "@/components/ui/card";
import { getPushHistory } from "@/lib/services/push-notification-service";

import { SendPushForm } from "./send-form";

export const dynamic = "force-dynamic";

export default function AdminPushNotificationsPage() {
  const history = getPushHistory();

  return (
    <div className="space-y-6">
      <div>
        <div className="ui-kicker">Mobile</div>
        <h1 className="ui-page-title">Push Notifications</h1>
      </div>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Send Test Push</h2>
          <SendPushForm />
        </div>
      </Card>

      <Card>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Push History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No push notifications sent yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2">When</th>
                  <th>Title</th>
                  <th>Body</th>
                  <th>Sent</th>
                  <th>Failed</th>
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
