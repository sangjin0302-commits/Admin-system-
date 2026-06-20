import { getActiveDevices } from "./mobile-bridge-service";
import { logger } from "@/lib/utils/logger";

export type PushNotification = {
  title: string;
  body: string;
  data?: Record<string, string>;
  targetTokens: string[];
};

type PushLogEntry = {
  at: Date;
  title: string;
  body: string;
  sent: number;
  failed: number;
};

const pushHistory: PushLogEntry[] = [];

export function getPushHistory(): PushLogEntry[] {
  return [...pushHistory].reverse();
}

export async function sendPush(
  notification: PushNotification
): Promise<{ sent: number; failed: number }> {
  const fcmKey = process.env.FCM_SERVER_KEY;

  if (!notification.targetTokens.length) {
    const result = { sent: 0, failed: 0 };
    pushHistory.push({
      at: new Date(),
      title: notification.title,
      body: notification.body,
      ...result,
    });
    return result;
  }

  if (!fcmKey) {
    logger.debug("[push-notification] mock send", {
      title: notification.title,
      body: notification.body,
      targets: notification.targetTokens.length,
    });
    const result = { sent: notification.targetTokens.length, failed: 0 };
    pushHistory.push({
      at: new Date(),
      title: notification.title,
      body: notification.body,
      ...result,
    });
    return result;
  }

  let sent = 0;
  let failed = 0;

  for (const token of notification.targetTokens) {
    try {
      const res = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${fcmKey}`,
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data ?? {},
        }),
      });
      if (res.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  const result = { sent, failed };
  pushHistory.push({
    at: new Date(),
    title: notification.title,
    body: notification.body,
    ...result,
  });
  return result;
}

export async function sendToAllDevices(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  const tokens = getActiveDevices()
    .map((d) => d.pushToken)
    .filter((t): t is string => Boolean(t));
  return sendPush({ title, body, data, targetTokens: tokens });
}

export async function notifyNewInquiryToMobile(name: string, type: string) {
  return sendToAllDevices(
    "New Inquiry Received",
    `${name} submitted a ${type} inquiry.`,
    { kind: "inquiry.new" }
  );
}

export async function notifyCaseUpdateToMobile(
  caseTitle: string,
  newStatus: string
) {
  return sendToAllDevices(
    "Case Updated",
    `${caseTitle} is now ${newStatus}.`,
    { kind: "case.updated" }
  );
}
