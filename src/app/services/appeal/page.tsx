import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { buildWebsiteIntakeHref, PUBLIC_MARKETING_SAFE_NOTICE } from "@/lib/services/public-marketing-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "행정심판·이의신청·소명 업무 안내",
  description:
    "강제퇴거명령, 출국명령, 입국금지, 체류 불허, 보완 요청 등 불복·소명 상담에서 확인할 항목을 안내합니다."
};

const situations = [
  "강제퇴거명령",
  "출국명령",
  "입국금지",
  "체류기간 연장 불허",
  "체류자격 변경 불허",
  "보완 요청",
  "처분서 또는 통지서 수령"
] as const;

const officeChecks = [
  "처분일",
  "통지일",
  "송달일",
  "불복 또는 신청 기한",
  "제출기관과 관할",
  "처분 사유",
  "증빙자료"
] as const;

const preparation = [
  "처분서 또는 통지서",
  "출입국 기록",
  "가족관계·거주·고용·소득·학업 자료",
  "진술서·사실확인서·탄원서 등, 사안별",
  "기존 신청서와 보완 요청 내역"
] as const;

const safetyScope = [
  "행정사 업무범위 확인이 필요합니다.",
  "변호사 업무 가능성 검토가 필요할 수 있습니다.",
  "기한 확인이 필수입니다.",
  "AI가 최종 법률판단을 하지 않습니다.",
  "고객 자료와 공식 기준 확인 후 안내합니다."
] as const;

const process = [
  ["01", "처분·통지 확인", "처분서와 통지일, 송달일을 먼저 확인합니다."],
  ["02", "기한 검토", "불복 또는 신청 기한을 사안별로 확인합니다."],
  ["03", "자료 정리", "처분 사유와 반박·소명 자료 후보를 정리합니다."],
  ["04", "업무범위 확인", "행정사 업무범위와 다른 전문가 검토 필요성을 확인합니다."],
  ["05", "다음 단계 안내", "제출 준비 가능 범위와 보완 대응 방향을 안내합니다."]
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

export default function AppealServiceLandingPage() {
  const intakeHref = buildWebsiteIntakeHref("appeal_landing");

  return (
    <main className="mx-auto max-w-6xl space-y-9">
      <section className="grid gap-5 lg:grid-cols-[1fr_0.78fr] lg:items-start">
        <div className="space-y-4">
          <p className="ui-kicker">행정심판·이의신청·소명</p>
          <h1 className="ui-page-title">처분서와 기한을 먼저 확인하고 대응 범위를 검토합니다.</h1>
          <p className="max-w-3xl text-base leading-7 text-text-muted">
            강제퇴거, 출국명령, 입국금지, 체류 관련 불허 처분은 통지일과 제출기한이 중요할 수 있습니다.
            받은 문서와 사실관계를 확인한 뒤 필요한 절차를 안내합니다.
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
              href="/services/immigration"
              className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
            >
              출입국·체류 업무 보기
            </Link>
          </div>
        </div>
        <Card muted className="p-5">
          <h2 className="ui-section-title">업무범위와 안전 안내</h2>
          <p className="mt-3 text-sm leading-6 text-text-muted">{PUBLIC_MARKETING_SAFE_NOTICE}</p>
          <div className="mt-4 grid gap-2">
            {safetyScope.map((note) => (
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
          <h2 className="ui-section-title">기한과 자료를 먼저 보고 다음 업무 범위를 정합니다.</h2>
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
            <h2 className="ui-section-title">처분서·통지서를 받았다면 날짜를 먼저 확인해 주세요.</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              접수 후 처분 사유, 통지일, 제출기관, 증빙자료를 확인합니다. 결과를 보장하지 않습니다.
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
