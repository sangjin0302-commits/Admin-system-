import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침 — ETHOS 행정사사무소",
  description: "에토스 행정사사무소의 개인정보 수집·이용·보관 처리방침."
};

export default function PrivacyPage() {
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="ethos-eyebrow">Privacy Policy</p>
          <h1 className="ethos-display mt-5 text-4xl sm:text-[3.2rem]">개인정보 처리방침</h1>
          <p className="mt-5 text-xs text-text-muted">최종 업데이트: 2026-06-13</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="space-y-6">
            <Section title="1. 수집하는 개인정보 항목">
              <p className="text-sm leading-relaxed text-text">에토스 행정사사무소는 다음과 같은 개인정보를 수집합니다.</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />필수: 성명, 연락처(전화/이메일), 상담 내용</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />선택: 사건 관련 자료(여권사본, 처분서 등)</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />자동 수집: 접속 IP, 접속 일시(보안 목적)</li>
              </ul>
            </Section>

            <Section title="2. 수집 및 이용 목적">
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />상담 접수 및 회신</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />위임 업무 진행 및 사안 관리</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />법령상 보관 의무 이행</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />사후 안내 및 만족도 확인</li>
              </ul>
            </Section>

            <Section title="3. 보유 및 이용 기간">
              <p className="text-sm leading-relaxed text-text">법령에 따라 보관 의무가 있는 경우 해당 기간 동안 보관하며, 일반적으로 다음 기준에 따릅니다.</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />상담 접수 자료: 접수일로부터 3년</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />위임 사건 자료: 종결일로부터 5년 (법령 기준에 따라 연장될 수 있음)</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />회계 관련 자료: 5년 (전자상거래법 등)</li>
              </ul>
            </Section>

            <Section title="4. 제3자 제공">
              <p className="text-sm leading-relaxed text-text">의뢰인 동의 없이 외부에 제공하지 않습니다. 단, 다음의 경우는 예외입니다.</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />법령에 따른 요청이 있는 경우</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />의뢰인이 사전에 명시적으로 동의한 기관(허가 관청, 법원 등)</li>
              </ul>
            </Section>

            <Section title="5. 처리 위탁">
              <p className="text-sm leading-relaxed text-text">현재 외부 위탁은 없으며, 사무소 내부에서 처리합니다. 향후 위탁이 발생하는 경우 별도 공지합니다.</p>
            </Section>

            <Section title="6. 정보주체의 권리">
              <p className="text-sm leading-relaxed text-text">의뢰인은 다음 권리를 행사할 수 있습니다.</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />개인정보 열람 / 정정 / 삭제 요청</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />처리 정지 요청</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />동의 철회</li>
              </ul>
            </Section>

            <Section title="7. 보안 조치">
              <p className="text-sm leading-relaxed text-text">의뢰인 자료는 사무소 내부 시스템에 분리 보관하며, 외부 자동 전송을 하지 않습니다. AI 분석은 의뢰인 사전 동의 시에만 익명화 처리 후 이용합니다.</p>
            </Section>

            <Section title="8. 개인정보 보호 책임자">
              <p className="text-sm leading-relaxed text-text">
                책임자: 행정사 Jean<br />
                연락: a.attorneyjean@gmail.com
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
