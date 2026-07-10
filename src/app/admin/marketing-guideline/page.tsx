import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import {
  getGuidelineDoc,
  listVersions,
} from "@/lib/services/marketing-guideline-doc-service";
import { GuidelineEditorClient } from "./guideline-editor-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "마케팅 지침 문서 · ETHOS 관리" };

export default async function AdminMarketingGuidelinePage() {
  if (!(await isFeatureEnabled("marketing_guideline_doc"))) notFound();

  const [current, versions] = await Promise.all([getGuidelineDoc(), listVersions()]);

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">운영 · AI</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">마케팅 지침 문서</h2>
      <p className="mt-2 text-sm text-text-muted">
        v6.4 등 마케팅 지침을 편집·버전 관리합니다. 저장된 지침은 AI 초안 생성
        (문의 답장·톤 조정)에 자동 주입되고, 지침 검증 UI에서 스캐너로 사용됩니다.
      </p>

      <div className="mt-6">
        <GuidelineEditorClient
          initialDoc={current}
          initialVersions={versions.map((v) => ({
            version: v.version,
            updatedAt: v.updatedAt,
          }))}
        />
      </div>
    </section>
  );
}
