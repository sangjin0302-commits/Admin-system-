import { IntakeForm } from "@/components/intake/intake-form";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/types/inquiry";

export const dynamic = "force-dynamic";

export default async function IntakePage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale: Locale = lang === "en" ? "en" : "ko";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="p-6 md:p-8">
        <div className="mb-6">
          <p className="ui-kicker">Consultation Intake</p>
          <h2 className="mt-3 ui-page-title">상담 접수 작성</h2>
        </div>
        <IntakeForm initialLocale={locale} />
      </Card>

      <Card muted className="p-6">
        <h3 className="ui-section-title">주의 사항</h3>
        <div className="mt-4 space-y-3 text-sm leading-6 text-text">
          <p>주요 전문 분야는 외국인 비자, 출입국, 체류, 행정심판 인허가 입니다.</p>
          <p>
            그 밖에 기타 관련 행정사 업무도 접수할 수 있으며 내용 확인 후 추가 안내가 필요한 분야로
            접수합니다.
          </p>
          <p>행정사 검토 이후 순차적으로 연락드리겠습니다.</p>
        </div>
      </Card>
    </div>
  );
}
