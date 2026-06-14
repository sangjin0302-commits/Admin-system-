import { LawbotConsole } from "./console";

export const dynamic = "force-dynamic";

export default function AdminLawbotPage() {
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">업무 도구</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">AI 사안 분석 (lawbot)</h2>
      <p className="mt-2 text-sm text-text-muted">
        사안 사실관계를 입력하면 lawbot이 분야 분류·검토 포인트·리스크·실무 가이드를 분석합니다. 결과는 참고용이며,
        실제 진행 전 담당자가 검증해야 합니다.
      </p>

      <div className="mt-6">
        <LawbotConsole />
      </div>
    </section>
  );
}
