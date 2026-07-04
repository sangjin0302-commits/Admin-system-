import { B2BInquiryForm } from "./form";

export const metadata = {
  title: "B2B 상담 신청 · ETHOS",
};

export default function B2BInquiryPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <p className="ui-kicker">Enterprise / B2B</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary">B2B 상담 신청</h1>
      <p className="mt-3 text-sm text-text-muted">
        예상 처리 건수와 주요 국적을 입력해 주시면 전담 관리자가 24시간 내 회신드립니다.
      </p>
      <div className="mt-8">
        <B2BInquiryForm />
      </div>
    </section>
  );
}
