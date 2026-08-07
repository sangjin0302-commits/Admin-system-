import type { Metadata } from "next";

import { ImmigrationServiceRoute } from "@/components/public/service-route-immigration";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "비자/외국인 체류 — 에토스 행정사사무소(ETHOS)",
  description: "체류 자격 변경·연장, 사업/투자 비자, 강제퇴거 대응까지 한 흐름으로 정리합니다."
};

export default function VisaPage() {
  return <ImmigrationServiceRoute lang="ko" />;
}
