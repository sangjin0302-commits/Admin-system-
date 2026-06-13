import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소 웹사이트 이용약관."
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-gold-deep">Terms of Service</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-primary sm:text-4xl">이용약관</h1>
      <p className="mt-3 text-xs text-text-muted">최종 업데이트: 2026-06-13</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-text">
        <Section title="제1조 (목적)">
          <p>본 약관은 에토스 행정사사무소(이하 "사무소")가 제공하는 웹사이트 및 상담 접수 서비스 이용에 관한 사항을 정합니다.</p>
        </Section>

        <Section title="제2조 (서비스 범위)">
          <p>사무소가 제공하는 서비스는 다음을 포함합니다.</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>온라인 상담 접수 및 회신</li>
            <li>접수번호 기반 진행상황 조회</li>
            <li>법률 칼럼 / 사례 정보 안내</li>
            <li>위임 사건의 진행 관리 (별도 위임 계약 시)</li>
          </ul>
        </Section>

        <Section title="제3조 (상담 접수의 효력)">
          <p>웹사이트를 통한 상담 접수는 위임 계약을 의미하지 않습니다. 위임 관계는 별도 서면 또는 전자 계약을 통해 성립합니다.</p>
        </Section>

        <Section title="제4조 (이용자의 의무)">
          <p>이용자는 다음을 준수합니다.</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>사실에 부합하는 정보 제공</li>
            <li>타인의 정보를 도용하지 않을 것</li>
            <li>웹사이트의 정상 운영을 방해하지 않을 것</li>
          </ul>
        </Section>

        <Section title="제5조 (사무소의 의무)">
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>관련 법령 및 행정사법, 행정사 윤리강령 준수</li>
            <li>의뢰인 정보의 비밀 유지</li>
            <li>위임받은 사건의 성실 처리</li>
          </ul>
        </Section>

        <Section title="제6조 (결과 보장의 한계)">
          <p>행정 절차의 결과는 관할 기관의 판단에 따라 결정되며, 사무소는 결과를 보장하지 않습니다. 모든 정보 제공은 일반적 안내이며 개별 사안에 대한 법률 자문이 아닙니다.</p>
        </Section>

        <Section title="제7조 (책임의 제한)">
          <p>사무소는 다음에 대해 책임지지 않습니다.</p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>이용자가 제공한 부정확한 정보로 인한 결과</li>
            <li>천재지변, 시스템 장애 등 불가항력적 사유</li>
            <li>제3자가 제공하는 외부 링크의 내용</li>
          </ul>
        </Section>

        <Section title="제8조 (분쟁 해결)">
          <p>본 약관과 관련된 분쟁은 협의를 통해 해결하며, 협의가 이루어지지 않을 경우 사무소 소재지 관할 법원을 전속 관할로 합니다.</p>
        </Section>

        <Section title="제9조 (약관의 변경)">
          <p>본 약관은 법령 또는 운영상의 사정에 따라 변경될 수 있으며, 변경 시 웹사이트에 공지합니다.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-lg font-bold text-primary">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}
