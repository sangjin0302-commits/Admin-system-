import { NextResponse } from "next/server";

import { registerDevice } from "@/lib/services/mobile-bridge-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      deviceId?: string;
      userId?: string;
      pushToken?: string;
      platform?: "ios" | "android";
    };

    if (!body.deviceId || !body.userId || !body.platform) {
      return NextResponse.json(
        { success: false, error: "deviceId, userId, platform required" },
        { status: 400 }
      );
    }

    const session = registerDevice({
      deviceId: body.deviceId,
      userId: body.userId,
      pushToken: body.pushToken,
      platform: body.platform,
    });

    return NextResponse.json({ success: true, data: session });
  } catch (err) {
    console.error("mobile/register POST failed", err);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
