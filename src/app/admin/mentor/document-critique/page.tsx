import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { notFound } from "next/navigation";
import DocumentCritiqueClient from "./document-critique-client";

export const dynamic = "force-dynamic";

export default async function DocumentCritiquePage() {
  if (!(await isFeatureEnabled("mentor_document_critique"))) notFound();
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="Mentoring · Document Critique"
        title="서면 첨삭"
        description="본인 초안 붙여넣기 → 5개 축 (법령·논리·사실·이익·명료성) 각 20점 채점"
      />
      <DocumentCritiqueClient />
    </div>
  );
}
