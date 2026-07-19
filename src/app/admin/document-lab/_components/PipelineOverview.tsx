import Link from "next/link";

import { Card } from "@/components/ui/card";

export function PipelineOverview() {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="ui-kicker">파이프라인 개요</p>
          <h3 className="mt-2 ui-section-title">HWP/HWPX 공공서식 파이프라인</h3>
          <p className="mt-2 text-sm text-text-muted">
            HWP 원본은 원본 자산으로 추적하고, 검증된 HWPX/DOCX/HTML만 실사용 서식 후보로 올립니다.
          </p>
        </div>
        <Link href="/admin/ledger" className="text-sm font-medium text-primary">
          운영 데이터는 아직 연결하지 않음
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {[
          ["1", "원본 확보", "공식 HWP 원본과 출처를 확인합니다."],
          ["2", "변환 검증", "HWPX/DOCX/HTML 후보의 표, 줄바꿈, 입력란을 비교합니다."],
          ["3", "관리자 미리보기", "샘플 데이터로 누락 필드와 레이아웃을 확인합니다."],
          ["4", "후속 연결", "검증 후 CaseMatter 읽기 전용 연결을 별도 작업으로 다룹니다."]
        ].map(([step, title, description]) => (
          <Card key={step} muted className="p-4">
            <p className="text-xs font-semibold text-text-muted">{step}단계</p>
            <h4 className="mt-2 text-sm font-semibold text-text-strong">{title}</h4>
            <p className="mt-2 text-xs text-text-muted">{description}</p>
          </Card>
        ))}
      </div>
    </Card>
  );
}
