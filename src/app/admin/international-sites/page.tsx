import { notFound } from "next/navigation";
import { getAllRegions } from "@/lib/services/international-site-service";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { RegionEditor } from "./region-editor";

export const dynamic = "force-dynamic";

export default async function AdminInternationalSitesPage() {
  if (!(await isFeatureEnabled("international_regions"))) notFound();
  const regions = await getAllRegions();

  return (
    <section className="space-y-6">
      <div className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
        <p className="ui-kicker">International Sites</p>
        <h2 className="mt-2 text-xl font-semibold text-text-strong">지역 사이트 관리 (KR / JP / VN)</h2>
        <p className="mt-1 text-sm text-text-muted">지역 활성화, 통화·연락처, 히어로 문구를 지역별로 관리합니다.</p>
      </div>
      {(["kr", "jp", "vn"] as const).map((code) => (
        <div key={code} className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel">
          <RegionEditor code={code} initial={regions[code]} />
        </div>
      ))}
    </section>
  );
}
