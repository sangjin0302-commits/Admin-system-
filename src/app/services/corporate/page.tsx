import type { Metadata } from "next";

import { CorporateServiceRoute } from "@/components/public/service-route-corporate";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "법인 설립 — 에토스 행정사사무소(ETHOS)",
  description: "법인 설립 절차, 정관·등기 준비, 설립 후 인허가 연계까지 한 흐름으로 정리합니다."
};

export default function CorporatePage() {
  return <CorporateServiceRoute lang="ko" />;
}
