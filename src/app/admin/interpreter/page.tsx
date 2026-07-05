import { InterpreterClient } from "./client";

export const dynamic = "force-dynamic";

export default function AdminInterpreterPage() {
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">Communication</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">다국어 실시간 통역</h2>
      <p className="mt-2 text-sm text-text-muted">
        상담 시 한국어 관리자 ↔ 외국어 고객 간 실시간 통역. Whisper/Web Speech 로 음성 인식, Claude Haiku 로 번역.
      </p>
      <div className="mt-6">
        <InterpreterClient />
      </div>
    </section>
  );
}
