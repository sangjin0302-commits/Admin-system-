import { NextResponse } from "next/server";

import { saveMarketingSnapshot, verifyMarketingSyncToken } from "@/lib/services/marketing-sync-service";

export async function POST(request: Request) {
  const token = request.headers.get("x-admin-sync-token");
  if (!verifyMarketingSyncToken(token)) {
    return NextResponse.json({ ok: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ ok: false, error: "유효한 마케팅 스냅샷 본문이 필요합니다." }, { status: 400 });
    }

    const result = await saveMarketingSnapshot(payload);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("Failed to ingest marketing snapshot", error);
    return NextResponse.json(
      { ok: false, error: "마케팅 스냅샷 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
