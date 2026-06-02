import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import {
  buildServiceIntakeHref,
  buildWebsiteIntakeHref,
  PUBLIC_MARKETING_SAFE_NOTICE,
  PUBLIC_MARKETING_SERVICES
} from "@/lib/services/public-marketing-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "출입국·행정심판·정보공개 업무 분야 안내",
  description: "출입국·체류, 행정심판·이의신청, 정보공개, 일반 행정서류 상담 분야를 안내합니다."
};

const featuredGroups = [
  {
    title: "출입국·체류",
    description: "체류기간 연장, 체류자격 변경, 초청, 출입국 관련 자료 정리를 검토합니다.",
    href: "/services/visa",
    situations: ["체류기간 연장", "체류자격 변경", "초청·방문 목적 정리"],
    checks: ["체류자격", "기한", "제출기관 기준"],
    preparation: ["여권·외국인등록 자료", "체류 관련 통지서", "소득·거주 자료"]
  },
  {
    title: "행정심판·이의신청",
    description: "처분서, 통지일, 기한, 사실관계, 증빙자료를 중심으로 진행 가능 범위를 확인합니다.",
    href: "/services/administrative-appeal",
    situations: ["거부·불허 처분", "강제퇴거·출국명령", "이의신청 검토"],
    checks: ["처분 내용", "불복기한", "증빙자료"],
    preparation: ["처분서", "통지일 확인 자료", "사실관계 설명 자료"]
  },
  {
    title: "정보공개·일반 행정",
    description: "정보공개청구, 민원, 사실관계 정리, 제출기관별 요구자료를 확인합니다.",
    href: "/services/civil-petition",
    situations: ["정보공개청구", "민원·진정", "기관 제출자료 정리"],
    checks: ["청구 대상 기관", "공개 범위", "제출 방식"],
    preparation: ["기관명", "청구 취지", "관련 사실관계"]
  },
  {
    title: "공통 서식·문서 준비",
    description: "위임장, 개인정보 동의, 사실확인, 제출자료 목록 등 반복 서식 준비 흐름을 정리합니다.",
    href: "/services/fact-contract",
    situations: ["위임장·동의서", "사실확인서", "제출자료 목록 정리"],
    checks: ["서식 최신성", "필수 입력값", "민감정보 포함 여부"],
    preparation: ["기본 인적사항", "사실관계 메모", "첨부자료 목록"]
  }
] as const;

const servicesProcess = [
  ["1단계", "상담 신청", "업무 분야와 현재 상황을 접수합니다."],
  ["2단계", "사실관계 및 자료 확인", "처분서, 통지일, 제출기관, 준비자료를 확인합니다."],
  ["3단계", "절차·기한 검토", "기한과 공식 서식, 제출처 기준을 검토합니다."],
  ["4단계", "필요 업무 안내", "진행 가능 범위와 다음 준비사항을 안내합니다."]
] as const;

const servicesFaqItems = [
  {
    question: "업무 분야를 정확히 몰라도 신청할 수 있나요?",
    answer: "가능합니다. 접수 내용과 자료를 확인한 뒤 적절한 검토 범위를 안내합니다."
  },
  {
    question: "자료가 부족하면 어떻게 되나요?",
    answer: "자료 확인 후 필요한 자료를 안내합니다. 사안별 검토가 필요합니다."
  },
  {
    question: "기관 제출까지 대신 진행되나요?",
    answer: "제출 가능 여부와 방식은 별도 확인이 필요하며, 시스템이 바로 기관에 내지 않습니다."
  },
  {
    question: "결과를 약속하나요?",
    answer: "결과를 보장하지 않습니다. 공식 기준과 자료를 확인한 뒤 안내합니다."
  }
] as const;

export default function ServicesPage() {
  const intakeHref = buildWebsiteIntakeHref("services");

  return (
    <main className="mx-auto max-w-6xl space-y-9">
      <section className="grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-end">
        <div>
          <p className="ui-kicker">전문 분야</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight text-text-strong">
            출입국·행정심판·정보공개 업무를 사안별로 검토합니다.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-text-muted">
            상담 신청 전 업무 영역을 확인하고, 접수 후에는 접수번호로 진행상황을 조회할 수 있습니다.
            각 업무는 공식 기준과 제출기관 요구사항 확인이 필요합니다.
          </p>
        </div>
        <Card muted className="p-5">
          <h2 className="text-base font-semibold text-text-strong">상담 전 확인</h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Link
              href={intakeHref}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
            >
              상담 신청하기
            </Link>
            <Link
              href="/track"
              className="inline-flex h-10 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              진행상황 조회
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="핵심 업무 영역">
        {featuredGroups.map((group) => (
          <Card key={group.title} className="p-5">
            <h2 className="text-xl font-semibold text-text-strong">{group.title}</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">{group.description}</p>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-text-muted sm:grid-cols-3">
              <div>
                <h3 className="font-semibold text-text-strong">대표 상황</h3>
                <ul className="mt-2 space-y-1">
                  {group.situations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-text-strong">사무소 확인</h3>
                <ul className="mt-2 space-y-1">
                  {group.checks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-text-strong">준비 자료</h3>
                <ul className="mt-2 space-y-1">
                  {group.preparation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href={intakeHref}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
              >
                상담 신청하기
              </Link>
              <Link
                href={group.href}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
              >
                자세히 보기
              </Link>
            </div>
          </Card>
        ))}
      </section>

      <section className="space-y-4" aria-label="상세 업무 분야 목록">
        <div>
          <p className="ui-kicker">상세 분야</p>
          <h2 className="ui-section-title">필요한 업무를 선택해 자료 준비 범위를 확인하세요.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PUBLIC_MARKETING_SERVICES.map((service) => (
            <Card key={service.slug} className="flex h-full flex-col p-5 transition hover:border-primary">
              <div className="flex-1">
                <p className="ui-kicker">{service.practiceArea}</p>
                <h3 className="mt-2 text-xl font-semibold text-text-strong">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-muted">{service.summary}</p>
                <p className="mt-3 text-xs leading-5 text-text-muted">사안별 검토와 공식 기준 확인이 필요합니다.</p>
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/services/${service.slug}`}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
                >
                  자세히 보기
                </Link>
                <Link
                  href={buildServiceIntakeHref(service)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
                >
                  상담 신청하기
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="services-process-heading">
        <div>
          <p className="ui-kicker">상담 진행 절차</p>
          <h2 id="services-process-heading" className="ui-section-title">
            자료 확인 후 필요한 업무 범위를 안내합니다.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {servicesProcess.map(([step, title, description]) => (
            <Card key={step} muted className="p-4">
              <p className="text-xs font-semibold text-primary">{step}</p>
              <h3 className="mt-2 text-base font-semibold text-text-strong">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
            </Card>
          ))}
        </div>
        <p className="text-sm leading-6 text-text-muted">
          결과를 보장하지 않습니다. 자료 확인 후 안내드리며, AI가 최종 판단하지 않습니다.
        </p>
      </section>

      <Card className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="ui-kicker">다음 단계</p>
            <h2 className="mt-2 ui-section-title">업무 분야를 고르기 어렵다면 상담 신청에서 상황을 남겨주세요.</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              접수 후 필요한 자료와 진행 가능 범위를 확인합니다. 이미 접수했다면 접수번호로 진행상황을 조회하세요.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={intakeHref}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
            >
              상담 신청하기
            </Link>
            <Link
              href="/track"
              className="inline-flex h-10 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              진행상황 조회
            </Link>
          </div>
        </div>
      </Card>

      <section className="space-y-4" aria-labelledby="services-faq-heading">
        <div>
          <p className="ui-kicker">업무 분야 FAQ</p>
          <h2 id="services-faq-heading" className="ui-section-title">
            상담 전 확인할 내용을 짧게 정리했습니다.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {servicesFaqItems.map((item) => (
            <Card key={item.question} className="p-5">
              <h3 className="text-base font-semibold text-text-strong">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-text-muted">{item.answer}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
