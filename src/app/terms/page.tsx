import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 — 에토스 행정사사무소(ETHOS)",
  description: "에토스 행정사사무소 웹사이트 이용약관."
};

export default async function TermsPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const lang = (await searchParams).lang === "en" ? "en" : "ko";
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="ethos-eyebrow">Terms of Service</p>
          <h1 className="ethos-display mt-5 text-4xl sm:text-[3.2rem]">이용약관</h1>
          <p className="mt-5 text-xs text-text-muted">최종 업데이트: 2026-06-13</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {lang === "en" && (
            <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <p className="font-serif text-sm font-bold text-amber-900">
                This page is only available in Korean.
              </p>
              <p className="mt-1.5 text-xs leading-6 text-amber-800">
                이 페이지는 한국어로 제공됩니다.
              </p>
            </div>
          )}
          <div className="space-y-6">
            <Section title="제1조 (목적)">
              <p className="text-sm leading-relaxed text-text">본 약관은 에토스 행정사사무소(이하 "사무소")가 제공하는 웹사이트 및 상담 접수 서비스 이용에 관한 사항을 정합니다.</p>
            </Section>

            <Section title="제2조 (서비스 범위)">
              <p className="text-sm leading-relaxed text-text">사무소가 제공하는 서비스는 다음을 포함합니다.</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />온라인 상담 접수 및 회신</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />접수번호 기반 진행상황 조회</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />법률 칼럼 / 사례 정보 안내</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />위임 사건의 진행 관리 (별도 위임 계약 시)</li>
              </ul>
            </Section>

            <Section title="제3조 (상담 접수의 효력)">
              <p className="text-sm leading-relaxed text-text">웹사이트를 통한 상담 접수는 위임 계약을 의미하지 않습니다. 위임 관계는 별도 서면 또는 전자 계약을 통해 성립합니다.</p>
            </Section>

            <Section title="제4조 (이용자의 의무)">
              <p className="text-sm leading-relaxed text-text">이용자는 다음을 준수합니다.</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />사실에 부합하는 정보 제공</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />타인의 정보를 도용하지 않을 것</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />웹사이트의 정상 운영을 방해하지 않을 것</li>
              </ul>
            </Section>

            <Section title="제5조 (사무소의 의무)">
              <ul className="space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />관련 법령 및 행정사법, 행정사 윤리강령 준수</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />의뢰인 정보의 비밀 유지</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />위임받은 사건의 성실 처리</li>
              </ul>
            </Section>

            <Section title="제6조 (결과 보장의 한계)">
              <p className="text-sm leading-relaxed text-text">행정 절차의 결과는 관할 기관의 판단에 따라 결정되며, 사무소는 결과를 보장하지 않습니다. 모든 정보 제공은 일반적 안내이며 개별 사안에 대한 법률 자문이 아닙니다.</p>
            </Section>

            <Section title="제7조 (책임의 제한)">
              <p className="text-sm leading-relaxed text-text">사무소는 다음에 대해 책임지지 않습니다.</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />이용자가 제공한 부정확한 정보로 인한 결과</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />천재지변, 시스템 장애 등 불가항력적 사유</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />제3자가 제공하는 외부 링크의 내용</li>
              </ul>
            </Section>

            <Section title="제8조 (분쟁 해결)">
              <p className="text-sm leading-relaxed text-text">본 약관과 관련된 분쟁은 협의를 통해 해결하며, 협의가 이루어지지 않을 경우 사무소 소재지 관할 법원을 전속 관할로 합니다.</p>
            </Section>

            <Section title="제9조 (약관의 변경)">
              <p className="text-sm leading-relaxed text-text">본 약관은 법령 또는 운영상의 사정에 따라 변경될 수 있으며, 변경 시 웹사이트에 공지합니다.</p>
            </Section>

            <Section title="제10조 (지식재산권 및 복제 금지)">
              <p className="text-sm leading-relaxed text-text">
                본 웹사이트에 게시된 모든 콘텐츠(텍스트·이미지·로고·디자인·레이아웃·구성·소스코드 및 편집 저작물)에 대한
                저작권 및 기타 지식재산권은 에토스 행정사사무소에 귀속됩니다. 사무소의 사전 서면 동의 없이 이를 복제·배포·전송·
                전시·2차적저작물 작성 등 어떠한 형태로도 무단 이용할 수 없으며, 위반 시 저작권법 등 관련 법령에 따른 민·형사상
                책임이 따를 수 있습니다.
              </p>
            </Section>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ethos-card p-7">
      <h2 className="font-serif text-base font-bold text-primary">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
