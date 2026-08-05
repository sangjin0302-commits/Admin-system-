import { getSiteSetting } from "@/lib/services/site-settings";

import { KakaoChannelFabClient } from "./kakao-channel-fab-client";

const FALLBACK_KAKAO = "http://pf.kakao.com/_xnQLnX";

/**
 * 카카오톡 채널 플로팅 버튼(우하단). AI 챗 대신 실제 상담 채널로 안내.
 * URL 은 admin `contact.kakaoUrl` 설정값 → 없으면 기본 채널.
 * 라벨/aria 는 클라이언트에서 현재 언어(document.lang)에 맞춰 렌더(영문 페이지 대응).
 */
export async function KakaoChannelFab() {
  const url = (await getSiteSetting("contact.kakaoUrl"))?.trim() || FALLBACK_KAKAO;
  return <KakaoChannelFabClient url={url} />;
}
