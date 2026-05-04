import type { Metadata } from "next";

import { PublicTrackClient } from "@/components/public-track/public-track-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "접수 진행상황 확인",
  description: "접수번호와 휴대폰 뒤 4자리로 고객용 진행상황을 확인합니다."
};

export default function TrackPage() {
  return (
    <section className="space-y-5 sm:space-y-6">
      <PublicTrackClient />
    </section>
  );
}
