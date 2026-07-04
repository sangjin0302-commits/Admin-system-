import { I18nEditor } from "./editor";

export const dynamic = "force-dynamic";

export default function AdminI18nPage() {
  return (
    <section className="rounded-[20px] border border-line bg-surface px-5 py-6 shadow-panel sm:px-7">
      <p className="ui-kicker">홈페이지 운영</p>
      <h2 className="mt-2 text-xl font-semibold text-text-strong">다국어 번역 편집</h2>
      <p className="mt-2 text-sm text-text-muted">
        네임스페이스별로 키를 열고 한국어·영어·중국어 번역을 덮어씁니다. 비워두면 기본값이 사용됩니다.
      </p>
      <div className="mt-6">
        <I18nEditor />
      </div>
    </section>
  );
}
