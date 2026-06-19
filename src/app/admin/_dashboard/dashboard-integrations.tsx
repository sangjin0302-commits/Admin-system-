import Link from "next/link";

import { Card } from "@/components/ui/card";

export function DashboardIntegrations() {
  return (
    <Card className="p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="ui-kicker">연동 업무실</p>
          <h3 className="mt-2 ui-section-title">Lawbot / Market Analyze 자리</h3>
        </div>
        <Link href="/admin/integrations" className="text-sm font-medium text-primary">
          연동 센터 열기
        </Link>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card muted className="p-4">
          <p className="ui-kicker">Lawbot</p>
          <h4 className="mt-2 text-base font-semibold text-text-strong">사건 기준 법률 분석 자리</h4>
          <p className="mt-2 text-sm text-text-muted">
            사건 상세에서 실제 분석 호출, 스냅샷 저장, 재분석 비교까지 연결해 둔 상태입니다.
          </p>
        </Card>
        <Card muted className="p-4">
          <p className="ui-kicker">Market Analyze</p>
          <h4 className="mt-2 text-base font-semibold text-text-strong">별도 프론트 구조 반영</h4>
          <p className="mt-2 text-sm text-text-muted">
            로컬 기준으로 dashboard, competitors, hot issues, sentiment, services 화면 구성이 확인되어
            system 안에 보여줄 자리를 만들어 둔 상태입니다.
          </p>
        </Card>
      </div>
    </Card>
  );
}
