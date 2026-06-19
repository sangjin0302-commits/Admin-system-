import { NextResponse } from "next/server";

import { sendKakaoAlimtalk } from "@/lib/services/kakao-notification-service";

export async function POST() {
  try {
    const ok = await sendKakaoAlimtalk({
      to: "01000000000",
      templateId: "test_template",
      variables: { name: "테스트", message: "카카오 알림톡 연동 테스트입니다." },
    });

    if (ok) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "알림톡 전송 실패 — 환경 변수 또는 API 설정을 확인하세요." },
      { status: 500 }
    );
  } catch (err) {
    console.error("[kakao/test] error", err);
    return NextResponse.json(
      { ok: false, error: "서버 오류" },
      { status: 500 }
    );
  }
}
