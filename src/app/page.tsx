import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getPublicIntakeContent } from "@/lib/public-content/service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getPublicIntakeContent();
  const ko = content.ko;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-surface px-6 py-7 lg:px-8 lg:py-9">
            <p className="ui-kicker">Public Intake Layer</p>
            <h2 className="mt-3 ui-page-title">{ko.heroTitle}</h2>
            <p className="mt-3 max-w-3xl text-base text-text">{ko.heroDescription}</p>
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
            <h3 className="ui-section-title">주요 전문 분야</h3>
            <div className="mt-5 space-y-3">
              {ko.primaryAreas.map((item) => (
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
          <p className="ui-kicker">Additional Guidance</p>
          <h3 className="mt-3 ui-section-title">추가 안내 가능 분야</h3>
          <p className="mt-3 ui-section-copy">{ko.additionalGuidance[0]}</p>
        </Card>
        <Card className="p-6">
          <p className="ui-kicker">Review Policy</p>
          <h3 className="mt-3 ui-section-title">직접 수행 범위와 검토 범위</h3>
          <p className="mt-3 ui-section-copy">{ko.additionalGuidance[1]}</p>
        </Card>
        <Card className="p-6">
          <p className="ui-kicker">Channel Strategy</p>
          <h3 className="mt-3 ui-section-title">외부 채널 연결 방식</h3>
          <p className="mt-3 ui-section-copy">{ko.additionalGuidance[2]}</p>
        </Card>
      </div>
    </div>
  );
}
