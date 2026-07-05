import { NextResponse } from "next/server";

import {
  getTeamNotificationConfig,
  saveTeamNotificationConfig,
  sendTeamNotification,
  type TeamNotificationConfig
} from "@/lib/services/team-notification-service";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    const config = await getTeamNotificationConfig();
    return NextResponse.json({ config });
  } catch (err) {
    logger.error("[team-notifications] GET failed", err);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // ignore
  }
  const action = typeof body.action === "string" ? body.action : "";
  try {
    if (action === "config") {
      const c = (body.config ?? {}) as Partial<TeamNotificationConfig>;
      const cfg: TeamNotificationConfig = {
        slack: typeof c.slack === "boolean" ? c.slack : true,
        discord: typeof c.discord === "boolean" ? c.discord : true,
        events: {
          new_inquiry: c.events?.new_inquiry ?? true,
          deadline_warning: c.events?.deadline_warning ?? true,
          high_priority: c.events?.high_priority ?? true,
          payment_received: c.events?.payment_received ?? true
        }
      };
      await saveTeamNotificationConfig(cfg);
      return NextResponse.json({ ok: true, config: cfg });
    }
    if (action === "test") {
      const result = await sendTeamNotification("new_inquiry", {
        title: "테스트 알림",
        summary: "Slack/Discord 웹훅 연결 테스트입니다."
      });
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
  } catch (err) {
    logger.error("[team-notifications] POST failed", err);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
