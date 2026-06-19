import { NextResponse } from "next/server";

import { createCampaign, listCampaigns } from "@/lib/services/email-campaign-service";

export async function GET() {
  return NextResponse.json({ campaigns: listCampaigns() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, subject, bodyHtml, targetSegment } = body ?? {};
    if (
      typeof name !== "string" ||
      typeof subject !== "string" ||
      typeof bodyHtml !== "string" ||
      !["all", "won", "active", "new"].includes(targetSegment)
    ) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }
    const campaign = createCampaign({ name, subject, bodyHtml, targetSegment });
    return NextResponse.json({ campaign });
  } catch (error) {
    return NextResponse.json({ error: "failed", detail: String(error) }, { status: 500 });
  }
}
