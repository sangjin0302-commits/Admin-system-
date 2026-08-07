import type { Metadata } from "next";

import { LicenseServiceRoute } from "@/components/public/service-route-license";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "인허가 — 에토스 행정사사무소(ETHOS)",
  description: "사업·건축·식품·의료 등 인허가 신청, 보완 대응, 불복 절차를 함께 합니다."
};

export default function LicensePage() {
  return <LicenseServiceRoute lang="ko" />;
}
