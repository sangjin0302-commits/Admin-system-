import type { Metadata } from "next";

import ConsultContent from "@/components/public/consult-content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "상담 안내 — 무료 검토 · 유료 상담 · 수임 시 차감 | ETHOS",
  description:
    "ETHOS 행정사사무소의 상담 구조 안내. 검토는 무료, 본격 상담은 유료(33,000~55,000원), 수임 확정 시 상담료 전액 차감."
};

export default function ConsultPage() {
  return <ConsultContent lang="ko" />;
}
