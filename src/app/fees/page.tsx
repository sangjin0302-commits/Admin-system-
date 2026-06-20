import Link from "next/link";
import type { Metadata } from "next";

import { Reveal } from "@/components/public/reveal";

export const metadata: Metadata = {
  title: "수임료 안내 — 분야별 참고 가격 | ETHOS",
  description:
    "ETHOS 행정사사무소의 분야별 수임료 참고 범위와 변동 요인을 안내합니다. 정확한 견적은 무료 1차 상담 후 제시됩니다."
};

type FeeRow = { name: string; range: string };
type FeeGroup = { area: string; eyebrow: string; rows: FeeRow[] };

const FEE_GROUPS: readonly FeeGroup[] = [
  {
    area: "비자 / 체류",
    eyebrow: "VISA & STAY",
    rows: [
      { name: "단기방문비자 (C-3)", range: "30 ~ 50만원" },
      { name: "거주비자 (F-2 / F-4)", range: "100 ~ 200만원" },
      { name: "영주권 (F-5)", range: "200 ~ 400만원" },
      { name: "귀화", range: "300 ~ 600만원" },
      { name: "체류기간 연장", range: "15 ~ 30만원" },
      { name: "체류자격 변경", range: "50 ~ 150만원" }
    ]
  },
  {
    area: "행정심판",
    eyebrow: "ADMINISTRATIVE APPEAL",
    rows: [
      { name: "강제퇴거 행정심판", range: "200 ~ 500만원" },
      { name: "일반 행정심판", range: "100 ~ 300만원" },
      { name: "이의신청", range: "50 ~ 150만원" }
    ]
  },
  {
    area: "계약 / 사실조사",
    eyebrow: "CONTRACT & INVESTIGATION",
    rows: [
      { name: "계약서 검토", range: "20 ~ 50만원" },
      { name: "사실조사 보고서", range: "100 ~ 300만원" }
    ]
  },
  {
    area: "인허가",
    eyebrow: "LICENSE & PERMIT",
    rows: [
      { name: "일반 영업허가", range: "100 ~ 300만원" },
      { name: "식품영업 허가", range: "50 ~ 150만원" },
      { name: "외국인 고용허가", range: "100 ~ 250만원" }
    ]
  },
  {
    area: "법인",
    eyebrow: "CORPORATE",
    rows: [
      { name: "주식회사 설립", range: "30 ~ 50만원" },
      { name: "외국인 법인설립", range: "100 ~ 200만원" }
    ]
  },
  {
    area: "번역 / 공증",
    eyebrow: "TRANSLATION & NOTARY",
    rows: [
      { name: "번역 (페이지당)", range: "5 ~ 15만원" },
      { name: "아포스티유", range: "10 ~ 30만원" },
      { name: "공증", range: "5 ~ 20만원" }
    ]
  }
];

const VARIABLES: readonly { title: string; desc: string }[] = [
  {
    title: "긴급도",
    desc: "긴급 처리 요청 시 통상 30 ~ 50% 가산됩니다."
  },
  {
    title: "사안 복잡도",
    desc: "추가 법령 검토·다수 처분 대응 등 복잡한 사안은 30 ~ 40% 가산됩니다."
  },
  {
    title: "법인 고객",
    desc: "법인 의뢰는 사안 규모와 자료량에 따라 개별 협의로 산정합니다."
  },
  {
    title: "추가 서류 작업",
    desc: "번역·공증·추가 진술서 등 부수 작업은 별도 산정됩니다."
  }
];

export default function FeesPage() {
  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="ethos-aurora ethos-aurora-animated" aria-hidden />
        <div className="absolute inset-0 -z-10 ethos-grid-pattern" aria-hidden />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="ethos-eyebrow">Fees</p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="ethos-display mt-5 text-4xl sm:text-[3.4rem]">
              수임료 안내 — 분야별 참고 가격
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="ethos-quote mt-5 text-base text-gold-deep">투명한 비용 안내</p>
          </Reveal>
          <Reveal delay={3}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-text-muted">
              아래 범위는 시장 평균을 참고한 안내가입니다. 사안별 정확한 견적은 무료 1차 상담 후 제시해 드립니다.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 분야별 비용 표 */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            {FEE_GROUPS.map((group, gi) => (
              <Reveal key={group.area} delay={((gi % 2) + 1) as 1 | 2}>
                <div className="ethos-card ethos-card-hover h-full p-8">
                  <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                    {group.eyebrow}
                  </p>
                  <h3 className="ethos-display mt-2 text-2xl">{group.area}</h3>
                  <ul className="mt-6 space-y-4">
                    {group.rows.map((row) => (
                      <li
                        key={row.name}
                        className="flex items-baseline justify-between gap-4 border-b border-gold/15 pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="text-sm leading-7 text-text">{row.name}</span>
                        <span className="whitespace-nowrap font-serif text-sm font-bold text-primary">
                          {row.range}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 변동 요인 — soft band */}
      <section className="ethos-band ethos-band-soft py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="ethos-eyebrow">Variables</p>
            <h2 className="ethos-display mt-3 text-3xl sm:text-4xl">수임료 변동 요인</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted">
              아래 요인에 따라 실제 수임료는 가감될 수 있으며, 상담 시 명확히 안내드립니다.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {VARIABLES.map((v, i) => (
              <Reveal key={v.title} delay={((i % 2) + 1) as 1 | 2}>
                <div className="ethos-card h-full p-7">
                  <p className="font-serif text-[11px] font-bold tracking-[0.2em] text-gold-deep">
                    FACTOR 0{i + 1}
                  </p>
                  <h3 className="ethos-display mt-2 text-xl">{v.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-text-muted">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="ethos-grain relative overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-primary via-primary to-text-strong p-12 text-center shadow-floating sm:p-16">
              <p className="ethos-eyebrow text-gold-soft">Get a Quote</p>
              <h2 className="ethos-display mt-4 text-3xl text-white sm:text-4xl">
                사안별 정확한 견적이 필요하신가요?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/80">
                간단한 사안 정보를 입력하시면 검토 후 회신드립니다. 1차 상담은 무료로 진행됩니다.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/intake"
                  className="inline-flex h-12 items-center rounded-lg bg-gold px-8 text-sm font-bold text-primary shadow-md transition-all duration-300 hover:bg-gold-soft hover:shadow-lg"
                >
                  사안별 정확한 견적 받기
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center rounded-lg border border-gold/50 px-8 text-sm font-semibold text-gold-soft transition hover:bg-gold/10"
                >
                  무료 1차 상담 신청
                </Link>
              </div>
            </div>
          </Reveal>

          <p className="ethos-quote mx-auto mt-10 max-w-3xl text-center text-xs italic text-text-muted">
            ※ 본 가격표는 시장 평균 참고용이며 실제 수임료는 사안 검토 후 확정됩니다. 정확한 견적은 무료 1차 상담을 통해 안내드립니다.
          </p>
        </div>
      </section>
    </div>
  );
}
