import type { Metadata } from "next";

import { CareersForm } from "@/components/public/careers-form";

export const metadata: Metadata = {
  title: "채용 · 멘토링 | ETHOS 행정사사무소",
  description:
    "ETHOS 행정사사무소와 함께할 정규직 · 파트타임 · 멘토링 파트너를 모십니다. 비자, 행정심판, 계약, 인허가 실무를 함께 성장시켜갈 분을 찾습니다.",
};

export const dynamic = "force-static";

const PERKS: Array<{ title: string; body: string }> = [
  { title: "성과 기반 인센티브", body: "정형화된 급여 외, 사건별 성과에 따른 추가 인센티브를 지급합니다." },
  { title: "재택·유연근무", body: "핵심 미팅 외에는 원격 근무 · 자율 시간표. 결과 중심으로 평가합니다." },
  { title: "지속 교육 지원", body: "행정심판·비자 심화 세미나, 어학·법률 콘텐츠 구독료를 사무소가 지원합니다." },
  { title: "AI 실무 툴", body: "사무소가 자체 구축한 AI 초안·리서치·CRM을 실무에 그대로 사용합니다." },
];

const CULTURE = [
  "우리는 서류 뒤에 있는 사람의 삶을 먼저 봅니다.",
  "빠른 속도보다 정확한 판단, 화려한 마케팅보다 정직한 결과를 선택합니다.",
  "동료의 실수는 시스템으로 잡고, 동료의 성장은 시간으로 기다립니다.",
];

export default function CareersPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <section className="mb-12 text-center">
        <p className="ui-kicker">CAREERS · MENTORSHIP</p>
        <h1 className="mt-3 text-3xl font-bold text-text-strong sm:text-4xl">
          ETHOS와 함께할 행정사를 찾습니다
        </h1>
        <p className="mt-4 text-base leading-relaxed text-text-muted">
          비자·행정심판·계약·인허가 실무를 사람 중심으로 다룰 동료, 그리고 실무를 배우고 싶은 예비 행정사를
          기다립니다.
        </p>
      </section>

      <section className="mb-12 grid gap-4 sm:grid-cols-3">
        {[
          { name: "정규직", desc: "실무 파트너 트랙. 사건 오너십과 지분 인센티브." },
          { name: "파트타임", desc: "특정 분야·프로젝트 단위 협업. 원격 근무 가능." },
          { name: "멘토링", desc: "실무 준비 중인 예비 행정사에게 실제 사건을 가이드." },
        ].map((t) => (
          <div key={t.name} className="rounded-2xl border border-border bg-white p-5">
            <h3 className="text-lg font-semibold text-text-strong">{t.name}</h3>
            <p className="mt-2 text-sm text-text-muted">{t.desc}</p>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-text-strong">근무 조건 · 복지</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PERKS.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-white p-4">
              <h3 className="text-sm font-semibold text-text-strong">{p.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-text-strong">우리의 방식</h2>
        <ul className="space-y-2 text-sm leading-relaxed text-text-muted">
          {CULTURE.map((c) => (
            <li key={c} className="flex gap-2">
              <span className="text-primary">·</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-surface-muted/30 p-6 sm:p-8">
        <h2 className="mb-4 text-xl font-semibold text-text-strong">지원하기</h2>
        <p className="mb-6 text-sm text-text-muted">
          아래 양식을 제출하시면 검토 후 이메일로 회신드립니다. 이력서는 URL(Google Drive 등) 공유가
          가능합니다.
        </p>
        <CareersForm />
      </section>
    </main>
  );
}
