import { notFound } from "next/navigation";
import { ToneAdjustPanel } from "@/components/admin/tone-adjust-panel";
import { isFeatureEnabled } from "@/lib/services/feature-flags-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "톤 조정 도구 · ETHOS 관리" };

export default async function ToneToolsPage() {
  const enabled = await isFeatureEnabled("message_tone_adjust");
  if (!enabled) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">답변 톤 조정</h1>
        <p className="mt-1 text-sm text-text-muted">
          답변 초안을 4개 톤(친근/공식/사과/안심) 중 하나로 재작성. 카톡·이메일 등 상황별 톤 미세조정 용도.
        </p>
      </div>
      <ToneAdjustPanel enabled />
    </div>
  );
}
