import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침 — 에토스 행정사사무소(ETHOS)",
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
          <p className="mt-5 text-xs text-text-muted">최종 업데이트: 2026-08-01</p>
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
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />자동 수집: 접속 IP, 접속 일시(보안 목적), 쿠키·방문 분석(Google Analytics — 이용자 동의 시)</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />선택(별도 동의): 뉴스레터 구독 이메일(마케팅 정보 수신)</li>
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

            <Section title="5. 처리 위탁 및 국외 이전">
              <p className="text-sm leading-relaxed text-text">원활한 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하고 있으며, 일부 수탁자는 국외에 소재합니다. 위탁 계약 시 관계 법령에 따라 개인정보가 안전하게 관리되도록 하고 있습니다.</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-xs leading-relaxed text-text">
                  <thead>
                    <tr className="border-b border-line text-left text-text-muted">
                      <th className="py-2 pr-3">수탁자</th>
                      <th className="py-2 pr-3">위탁 업무</th>
                      <th className="py-2">이전 국가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Resend (Resend, Inc.)", "이메일 발송(접수확인·뉴스레터)", "미국"],
                      ["Anthropic (Claude)", "영업시간 외 자동 응대 생성", "미국"],
                      ["Telegram", "관리자 접수 알림", "해외"],
                      ["Upstash", "접속 IP 기반 보안(rate-limit)", "해외"],
                      ["카카오", "알림톡 발송(선택)", "국내"],
                      ["Google (Workspace)", "문서·일정·시트 처리(연동 시)", "미국"],
                    ].map(([w, task, loc]) => (
                      <tr key={w} className="border-b border-line/60">
                        <td className="py-2 pr-3 font-semibold text-text-strong">{w}</td>
                        <td className="py-2 pr-3">{task}</td>
                        <td className="py-2">{loc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-text-muted">국외 이전 항목: 성명·연락처·문의내용 등 서비스 처리에 필요한 최소 정보. 이전 시점: 서비스 이용 시점. 이전 방법: 정보통신망을 통한 전송. 정보주체는 국외 이전을 거부할 수 있으며, 거부 시 일부 서비스(이메일 회신 등) 이용이 제한될 수 있습니다.</p>
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
              <p className="text-sm leading-relaxed text-text">의뢰인 자료는 접근 권한 통제, 전송 구간 암호화, 접속 기록 관리 등 관리적·기술적 보호 조치 하에 처리합니다. 제5항의 수탁자에게 전송되는 정보는 서비스 제공에 필요한 최소 범위로 제한합니다. AI 자동 응대는 필요한 경우에 한해 이용하며, 관련 처리 사실을 본 방침으로 고지합니다.</p>
            </Section>

            <Section title="8. 개인정보의 파기">
              <p className="text-sm leading-relaxed text-text">보유 기간(제3항)이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text">
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />파기 절차: 목적 달성·기간 경과 시 내부 방침에 따라 지체 없이 파기</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />전자적 파일: 복구·재생이 불가능한 방식으로 영구 삭제</li>
                <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-deep" />종이 문서: 분쇄 또는 소각</li>
              </ul>
            </Section>

            <Section title="9. 개인정보 보호 책임자">
              <p className="text-sm leading-relaxed text-text">
                책임자: 행정사 지상진<br />
                연락: a.attorneyjean@gmail.com<br />
                <span className="text-text-muted">정보주체는 개인정보 관련 문의·열람·정정·삭제·처리정지·동의철회를 위 연락처로 요청할 수 있습니다.</span>
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
