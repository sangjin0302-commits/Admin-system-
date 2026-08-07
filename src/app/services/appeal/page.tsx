import type { Metadata } from "next";

import { AppealServiceRoute } from "@/components/public/service-route-appeal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "행정심판 — 에토스 행정사사무소(ETHOS)",
  description: "처분 통지부터 청구·심리·재결까지 행정심판 절차를 함께 준비합니다."
};

export default function AppealPage() {
  return <AppealServiceRoute lang="ko" />;
}
