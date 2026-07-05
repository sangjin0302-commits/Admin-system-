import type { Metadata } from "next";
import Link from "next/link";

import { ArCardScene } from "./ar-card-scene";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getSiteSettings } from "@/lib/services/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ETHOS AR 명함",
  description: "QR 스캔으로 진입하는 3D 명함 — 회전 로고, 태그라인, 연락처가 공중에 뜹니다.",
};

export default async function ArCardPage() {
  const enabled = await isFeatureEnabled("ar_card");
  const site = await getSiteSettings();

  if (!enabled) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-primary">준비 중입니다</h1>
        <p className="mt-3 text-sm text-text-muted">AR 명함 기능은 현재 비활성화되어 있습니다.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-gold-deep underline">
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-[rgb(18,40,65)] to-[rgb(12,28,48)] text-white">
      <ArCardScene
        tagline="절차에는 이성을, 사람에게는 공감을, 일에는 신뢰를"
        phone={site["contact.phone"]}
        email={site["contact.email"]}
      />
    </div>
  );
}
