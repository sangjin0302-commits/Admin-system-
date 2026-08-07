import type { Metadata } from "next";

import { ContractServiceRoute } from "@/components/public/service-route-contract";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "계약서 / 사실조사 — 에토스 행정사사무소(ETHOS)",
  description: "계약 검토·작성, 분쟁 사실관계 조사, 조사보고서 작성을 지원합니다."
};

export default function ContractPage() {
  return <ContractServiceRoute lang="ko" />;
}
