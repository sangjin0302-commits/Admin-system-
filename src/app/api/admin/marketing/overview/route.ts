import { NextResponse } from "next/server";

import { readMarketingSnapshot } from "@/lib/services/marketing-sync-service";

export async function GET() {
  try {
    const snapshot = await readMarketingSnapshot();
    if (!snapshot) {
      return NextResponse.json(
        {
          ok: false,
          error: "저장된 마케팅 스냅샷이 없습니다.",
          snapshot: null
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    console.error("Failed to load marketing snapshot", error);
    return NextResponse.json(
      {
        ok: false,
        error: "마케팅 스냅샷을 불러오지 못했습니다."
      },
      { status: 500 }
    );
  }
}
