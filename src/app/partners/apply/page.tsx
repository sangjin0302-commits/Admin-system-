import { ApplyForm } from "./form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "파트너 신청 · ETHOS",
  description: "행정사·세무사·회계사 파트너 신청",
};

export default function PartnerApplyPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <p className="ui-kicker">Partner Program</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-primary">파트너 신청</h1>
      <p className="mt-3 text-sm text-text-muted">
        의뢰인을 소개해 주시면 사건 종결 시 수수료를 지급합니다. 승인 후 개인 추천 코드가
        발급됩니다.
      </p>
      <div className="mt-8">
        <ApplyForm />
      </div>
    </section>
  );
}
