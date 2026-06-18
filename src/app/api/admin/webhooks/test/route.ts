import { sendWebhookNotification } from "@/lib/services/webhook-notification-service";

export async function POST() {
  const result = await sendWebhookNotification({
    type: "webhook.test",
    title: "테스트 알림",
    message: "웹훅 연결이 정상적으로 작동하고 있습니다.",
    metadata: { "전송 시각": new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) },
  });

  return Response.json({
    success: result.slack || result.telegram,
    slack: result.slack,
    telegram: result.telegram,
  });
}
