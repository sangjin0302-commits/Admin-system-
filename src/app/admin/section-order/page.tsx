import Link from "next/link";
import { Card } from "@/components/ui/card";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  getSectionOrder,
  getSectionSchema
} from "@/lib/services/site-section-order-service";
import { SectionOrderClient } from "./section-order-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "섹션 순서 — 관리자"
};

export default async function AdminSectionOrderPage() {
  const enabled = await isFeatureEnabled("cms_section_order");

  if (!enabled) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="ui-kicker">Section Order</p>
          <h1 className="mt-2 ui-page-title">페이지 섹션 순서</h1>
          <p className="mt-2 text-sm text-text-muted">
            이 기능은 현재 비활성 상태입니다. <Link href="/admin/features" className="underline">기능 플래그</Link>에서
            <code className="mx-1 rounded bg-line/40 px-1 py-0.5 text-xs">cms_section_order</code>를 켠 뒤 사용하세요.
          </p>
        </Card>
      </div>
    );
  }

  const schema = getSectionSchema("homepage");
  const order = await getSectionOrder("homepage");

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Section Order</p>
        <h1 className="mt-2 ui-page-title">홈페이지 섹션 순서</h1>
        <p className="mt-2 text-sm text-text-muted">
          위·아래 버튼으로 홈페이지 섹션 순서를 조정한 뒤 저장하세요. 실제 반영에는 페이지 렌더링 배선이 필요합니다 (scaffolding).
        </p>
      </Card>

      <SectionOrderClient page="homepage" initialOrder={order} schema={[...schema]} />
    </div>
  );
}
