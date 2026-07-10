import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";
import { getGuidelineDoc } from "@/lib/services/marketing-guideline-doc-service";
import { AiDraftCheckClient } from "./ai-draft-check-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI 초안 지침 검증 · ETHOS 관리" };

export default async function AdminAiDraftCheckPage() {
  if (!(await isFeatureEnabled("ai_draft_guideline_check"))) notFound();
  const doc = await getGuidelineDoc().catch(() => null);

  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">AI · 검증</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">AI 초안 지침 검증</h2>
      <p className="mt-2 text-sm text-text-muted">
        AI가 생성한 초안 문안을 붙여넣고 <b>지침 검증</b>을 누르면 v6.4 마케팅 지침 위반
        문구를 감지하고 어느 규정이 적용됐는지 보여줍니다.
        {doc && (
          <>
            {" "}
            (현재 지침: <span className="font-mono text-primary">{doc.version}</span>)
          </>
        )}
      </p>

      <div className="mt-6">
        <AiDraftCheckClient guidelineVersion={doc?.version ?? null} />
      </div>
    </section>
  );
}
