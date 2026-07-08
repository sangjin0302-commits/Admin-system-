import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import CaseSimulatorClient from "./case-simulator-client";

export const dynamic = "force-dynamic";

export default async function CaseSimulatorPage() {
  if (!(await isFeatureEnabled("mentor_case_simulator"))) notFound();
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Mentoring · Case Simulator"
        title="사례 시뮬레이터"
        description="AI가 실제 같은 상담 시나리오를 생성합니다. 답변 → 채점 → 모범답안 순환 훈련."
      />
      <CaseSimulatorClient />
    </div>
  );
}
