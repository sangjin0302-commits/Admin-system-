import Link from "next/link";

import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-surface px-6 py-7 lg:px-8 lg:py-9">
            <p className="ui-kicker">Public Intake Layer</p>
            <h2 className="mt-3 ui-page-title">외부 공개 접수와 내부 운영 관리를 분리한 상담 시스템</h2>
            <p className="mt-3 max-w-3xl text-base text-text">
              이제 외부 채널에서는 공개 접수 링크만 사용하고, 내부 운영팀은 관리자 화면에서만 처리할 수 있습니다.
              네이버 블로그, 카페, 링크 버튼, 광고 랜딩에서 공개 접수 경로를 그대로 연결하면 됩니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/intake"
                className="inline-flex h-11 items-center rounded-md border border-primary bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#143d5d]"
              >
                상담 접수하기
              </Link>
              <Link
                href="/intake?lang=en"
                className="inline-flex h-11 items-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
              >
                English Intake
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex h-11 items-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
              >
                관리자 로그인
              </Link>
            </div>
          </div>

          <div className="border-t border-line bg-surface-muted px-6 py-7 lg:border-l lg:border-t-0 lg:px-8 lg:py-9">
            <h3 className="ui-section-title">운영 구조</h3>
            <div className="mt-5 space-y-3">
              {[
                "외부 공개 경로는 /intake 하나로 통일",
                "관리자 운영은 /admin 로그인 뒤에만 접근",
                "접수 데이터는 그대로 Inquiry로 들어와 내부 워크플로우로 연결",
                "블로그/광고에서는 공개 접수 링크만 노출"
              ].map((item) => (
                <div key={item} className="rounded-md border border-line bg-surface px-4 py-3">
                  <p className="text-sm text-text">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="p-6">
          <p className="ui-kicker">Channel Use</p>
          <h3 className="mt-3 ui-section-title">외부 홍보 채널용 링크</h3>
          <p className="mt-3 ui-section-copy">
            네이버 블로그, 지식인, 카페, 문자 링크, 광고 소재에는 <span className="font-semibold text-text-strong">/intake</span>{" "}
            경로만 쓰면 됩니다.
          </p>
        </Card>
        <Card className="p-6">
          <p className="ui-kicker">Internal Ops</p>
          <h3 className="mt-3 ui-section-title">내부 운영 전용 접근</h3>
          <p className="mt-3 ui-section-copy">
            견적, 사건, 후속조치, 감사로그는 모두 관리자 인증 뒤의 <span className="font-semibold text-text-strong">/admin</span>{" "}
            영역에서만 처리합니다.
          </p>
        </Card>
        <Card className="p-6">
          <p className="ui-kicker">Flow</p>
          <h3 className="mt-3 ui-section-title">데이터 연결은 유지</h3>
          <p className="mt-3 ui-section-copy">
            공개 접수와 내부 운영은 화면만 분리되고, 데이터는 같은 DB에서 이어져 기존 상담부터 종결까지 흐름은 그대로 유지됩니다.
          </p>
        </Card>
      </div>
    </div>
  );
}
