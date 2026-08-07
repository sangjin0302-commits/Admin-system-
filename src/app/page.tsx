import type { Metadata } from "next";

import HomeContent, { buildHomeMetadata } from "@/components/public/home-content";

// 정적 KO 홈(searchParams 미사용) → ISR. 방문마다 함수호출 대신 CDN 캐시.
// 예전에는 searchParams.lang 을 읽어 강제 동적 렌더가 됐고 revalidate 가 무효였다.
export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildHomeMetadata("ko");
}

export default function PublicMarketingHomePage() {
  return <HomeContent lang="ko" />;
}
