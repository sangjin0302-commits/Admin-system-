import type { Metadata } from "next";

import HomeContent, { buildHomeMetadata } from "@/components/public/home-content";

// 정적 EN 홈(searchParams 미사용) → ISR. 방문마다 함수호출 대신 CDN 캐시.
// 이제 /en 은 축약본이 아니라 전체 홈을 영어로 렌더한다(/ 와 동일 구조, 언어만 EN).
export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildHomeMetadata("en");
}

export default function EnglishHomePage() {
  return <HomeContent lang="en" />;
}
