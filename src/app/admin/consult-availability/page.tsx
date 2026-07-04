import { getAvailabilityConfig } from "@/lib/services/consultation-slots-service";

import { ConsultAvailabilityForm } from "./form";

export const dynamic = "force-dynamic";

export default async function AdminConsultAvailabilityPage() {
  const config = await getAvailabilityConfig();

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 운영</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">상담 가용시간</h2>
      <p className="mt-2 text-sm text-text-muted">
        요일별 상담 가능 시간과 특정일 차단 목록을 편집합니다. 여기 저장된 슬롯이 공개 예약 페이지
        <code className="mx-1 rounded bg-surface-muted px-1 text-xs">/book-consultation</code>
        에 노출됩니다.
      </p>

      <div className="mt-6">
        <ConsultAvailabilityForm initial={config} />
      </div>
    </section>
  );
}
