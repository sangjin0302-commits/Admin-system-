import { NextResponse } from "next/server";

import {
  sendPush,
  sendToAllDevices,
} from "@/lib/services/push-notification-service";
import { requireRole } from "@/lib/services/admin-rbac-service";

export async function POST(req: Request) {
  const guard = await requireRole(req, ["SUPER", "MANAGER"]);
  if (!guard.ok) return guard.response;

  try {
    const body = (await req.json()) as {
      title?: string;
      body?: string;
      targetTokens?: string[];
      data?: Record<string, string>;
    };

    if (!body.title || !body.body) {
      return NextResponse.json(
        { success: false, error: "title and body required" },
        { status: 400 }
      );
    }

    const result =
      body.targetTokens && body.targetTokens.length > 0
        ? await sendPush({
            title: body.title,
            body: body.body,
            data: body.data,
            targetTokens: body.targetTokens,
          })
        : await sendToAllDevices(body.title, body.body, body.data);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("admin/push/send POST failed", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
