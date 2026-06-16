import { NextResponse } from "next/server";

import { getSiteSettings } from "@/lib/services/site-settings";

/**
 * 공개 연락처 정보만 반환 (푸터 등에서 사용). 민감정보 없음.
 */
export async function GET() {
  const site = await getSiteSettings();
  return NextResponse.json({
    ok: true,
    phone: site["contact.phone"],
    email: site["contact.email"],
    hours: site["contact.hours"],
    kakaoUrl: site["contact.kakaoUrl"]
  });
}
