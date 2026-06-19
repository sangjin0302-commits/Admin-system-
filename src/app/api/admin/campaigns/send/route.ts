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
    return NextResponse.json({ error: "failed", detail: String(error) }, { status: 500 });
  }
}
