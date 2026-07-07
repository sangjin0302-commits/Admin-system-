import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getAllDeadlineTypes } from "@/lib/services/deadline-calculator";
import DeadlineCalculatorClient from "./client";

export const dynamic = "force-dynamic";

export default async function DeadlineCalculatorPage() {
  const holidayAware = await isFeatureEnabled("deadline_holiday_aware");
  const types = getAllDeadlineTypes();
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Practical Accuracy</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">기한 계산기 (공휴일·특별법)</h2>
      <p className="mt-2 text-sm text-text-muted">
        한국 공휴일·주말 자동 순연 (민법 제161조), 특별법(소음진동·국세·병역) 기간 규정 반영.
        {!holidayAware && " · 공휴일 반영은 feature flag off 상태"}
      </p>
      <div className="mt-6">
        <DeadlineCalculatorClient types={types} holidayAware={holidayAware} />
      </div>
    </section>
  );
}
