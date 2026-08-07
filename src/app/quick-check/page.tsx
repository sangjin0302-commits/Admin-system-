import type { Metadata } from "next";

import QuickCheckContent from "@/components/public/quick-check-content";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI 사전 진단 — 에토스 행정사사무소(ETHOS)",
  description:
    "사안 내용을 입력하면 lawbot AI가 행정사 업무 범위, 확인 사항, 위험 신호를 사전 안내합니다. 상담 신청 전 빠르게 방향을 잡으세요."
};

export default function QuickCheckPage() {
  return <QuickCheckContent lang="ko" />;
}
