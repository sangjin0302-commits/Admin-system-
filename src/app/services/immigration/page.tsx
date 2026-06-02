import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "출입국·체류 업무 안내",
  description: "체류기간 연장, 체류자격 변경, 사증, 외국인등록, 보완 요청 등 출입국·체류 상담 범위를 안내합니다."
};

const situations = [
  "체류기간 만료가 가까움",
  "체류자격 변경 또는 연장 준비",
  "사증·외국인등록 관련 서류 준비",
  "보완 요청 대응",
  "가족·고용·학업·사업 기반 소명 필요"
] as const;

const officeChecks = [
  "현재 체류자격",
  "체류기간 만료일",
  "처분서 또는 통지서 유무",
  "제출기관과 관할",
  "필요 자료 목록"
] as const;

const preparation = [
  "여권",
  "외국인등록증, 해당 시",
  "체류자격 관련 자료",
  "가족관계·고용·소득·거주 자료, 사안별",
  "기존 제출자료 또는 보완 요청 문서"
] as const;

const process = [
  ["01", "접수", "현재 체류 상황과 희망하는 다음 단계를 남깁니다."],
  ["02", "사실관계 확인", "체류자격, 만료일, 제출기관, 통지서 유무를 확인합니다."],
  ["03", "자료요청", "사안별로 필요한 자료와 보완 가능성을 안내합니다."],
  ["04", "기한·서식 확인", "공식 서식과 제출기관 기준, 기한을 확인합니다."],
  ["05", "문서 준비", "관리자 검토 후 필요한 문서 준비 범위를 정리합니다."]
] as const;

const safetyNotes = [
  "사안별 검토가 필요합니다.",
  "공식 서식과 제출기관 기준을 확인합니다.",
  "결과를 보장하지 않습니다.",
  "시스템이 기관에 바로 제출하지 않습니다.",
  "AI가 최종 판단하지 않습니다."
] as const;

function ListCard({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <Card className="h-full p-5">
      <h2 className="text-lg font-semibold text-text-strong">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ImmigrationServiceLandingPage() {
  const intakeHref = buildWebsiteIntakeHref("immigration_landing");

  return (
    <main className="mx-auto max-w-6xl space-y-9">
      <section className="grid gap-5 lg:grid-cols-[1fr_0.78fr] lg:items-start">
        <div className="space-y-4">
          <p className="ui-kicker">출입국·체류 업무</p>
          <h1 className="ui-page-title">체류기간, 자격변경, 사증, 외국인등록 흐름을 사안별로 확인합니다.</h1>
          <p className="max-w-3xl text-base leading-7 text-text-muted">
            출입국·체류 업무는 체류자격, 만료일, 제출기관 기준에 따라 준비자료가 달라질 수 있습니다.
            먼저 현재 상황과 받은 문서를 확인한 뒤 다음 단계를 안내합니다.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={intakeHref}
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
            >
              상담 신청하기
            </Link>
            <Link
              href="/track"
              className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              진행상황 조회
            </Link>
            <Link
              href="/services/appeal"
              className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              행정심판·이의신청 보기
            </Link>
          </div>
        </div>
        <Card muted className="p-5">
          <h2 className="ui-section-title">안전 안내</h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
          <div className="mt-4 grid gap-2">
            {safetyNotes.map((note) => (
              <span key={note} className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-text">
                {note}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <ListCard title="대표 상황" items={situations} />
        <ListCard title="사무소 확인 사항" items={officeChecks} />
        <ListCard title="준비 자료" items={preparation} />
      </section>

      <section className="space-y-4">
        <div>
          <p className="ui-kicker">상담 진행 흐름</p>
          <h2 className="ui-section-title">자료 확인 후 필요한 준비 범위를 좁힙니다.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {process.map(([step, title, description]) => (
            <Card key={step} muted className="p-4">
              <p className="text-xs font-semibold text-primary">{step}</p>
              <h3 className="mt-2 text-base font-semibold text-text-strong">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="ui-kicker">다음 단계</p>
            <h2 className="ui-section-title">체류 이슈가 있다면 날짜와 보유 문서를 먼저 정리해 주세요.</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              접수 후 사안별로 필요한 자료를 안내합니다. 체류기간 만료일과 제출기한은 중요할 수 있습니다.
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
              href="/services"
              className="inline-flex h-10 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              전문 분야 보기
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
