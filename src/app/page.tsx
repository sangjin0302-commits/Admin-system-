import Link from "next/link";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "행정사 문의 접수 및 진행상황 조회",
  description: "상담 접수와 고객용 진행상황 조회를 시작합니다."
};

const gatewayActions = [
  {
    href: "/intake",
    label: "접수하기",
    description: "필요한 업무 분야를 선택하고 상담 요청을 남깁니다.",
    primary: true
  },
  {
    href: "/track",
    label: "진행상황 조회",
    description: "접수 후 받은 접수번호와 휴대폰 뒤 4자리로 확인합니다.",
    primary: false
  }
];

export default function PublicGatewayPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <section className="space-y-4 py-3 sm:py-8">
        <p className="ui-kicker">고객 안내</p>
        <h1 className="ui-page-title">행정사 문의 접수 및 진행상황 조회</h1>
        <p className="max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
          접수 후 받은 접수번호로 진행상황을 확인할 수 있습니다. 문의 접수와 진행상황 조회 중
          필요한 항목을 선택해 주세요.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="고객용 바로가기">
        {gatewayActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`block rounded-lg border p-5 transition ${
              action.primary
                ? "border-primary bg-primary text-white hover:bg-[#143d5d]"
                : "border-line-strong bg-surface text-text-strong hover:bg-surface-muted"
            }`}
          >
            <span className="text-lg font-semibold">{action.label}</span>
            <span
              className={`mt-2 block text-sm leading-6 ${
                action.primary ? "text-white/90" : "text-text-muted"
              }`}
            >
              {action.description}
            </span>
          </Link>
        ))}
      </section>

      <Card muted className="p-5">
        <h2 className="ui-section-title">진행상황 확인 방법</h2>
        <ul className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-text">
          <li>접수 완료 화면 또는 안내문에서 접수번호를 확인합니다.</li>
          <li>진행상황 조회에서 접수번호와 휴대폰 뒤 4자리를 입력합니다.</li>
          <li>고객용 요약 상태만 표시되며 자세한 상담 내용은 담당자 연락으로 안내됩니다.</li>
        </ul>
      </Card>
    </main>
  );
}
