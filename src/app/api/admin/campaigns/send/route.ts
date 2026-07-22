import { NextResponse } from "next/server";

import { sendCampaign } from "@/lib/services/email-campaign-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body ?? {};
    if (typeof id !== "string") {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const result = await sendCampaign(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("admin/campaigns/send POST failed", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
