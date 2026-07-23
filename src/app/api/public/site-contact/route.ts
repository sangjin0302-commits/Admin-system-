import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";
import { getSiteSettings } from "@/lib/services/site-settings";

/**
 * 공개 연락처 정보만 반환 (푸터 등에서 사용). 민감정보 없음.
 */
export async function GET() {
  try {
    const site = await getSiteSettings();
    const badgeRow = await prisma.siteSetting
      .findUnique({ where: { key: "image.assocBadge" } })
      .catch(() => null);
    return NextResponse.json({
      ok: true,
      phone: site["contact.phone"],
      email: site["contact.email"],
      hours: site["contact.hours"],
      kakaoUrl: site["contact.kakaoUrl"],
      trust: {
        bizRegNo: site["trust.bizRegNo"],
        adminLicenseNo: site["trust.adminLicenseNo"],
        representative: site["trust.representative"],
        officeAddress: site["trust.officeAddress"],
        kakaoMapUrl: site["trust.kakaoMapUrl"],
        assocBadge: badgeRow?.value || ""
      }
    });
  } catch (error) {
    console.error("[public/site-contact] failed", error);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
