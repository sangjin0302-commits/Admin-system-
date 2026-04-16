import { Card } from "@/components/ui/card";

const lawTargets = [
  "출입국관리법",
  "출입국관리법 시행령",
  "출입국관리법 시행규칙",
  "국적법",
  "국적법 시행령",
  "행정심판법",
  "행정절차법",
  "민원 처리에 관한 법률",
  "재한외국인 처우 기본법"
];

const precedentTargets = [
  "출입국관리법 강제퇴거",
  "출입국관리법 체류자격 변경",
  "외국인등록 처분 취소",
  "행정심판 집행정지",
  "행정절차법 처분서 작성 교부",
  "민원 처리에 관한 법률 보완요구"
];

export default function AdminMonitoringPage() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">법령 모니터링</p>
        <h2 className="mt-2 ui-page-title">법령·판례 모니터링 허브</h2>
        <p className="mt-2 text-sm text-text-muted">
          현재 모니터링은 Lawbot 텔레그램 명령과 Notion 저장을 기준으로 운영됩니다. 변경이 실제로
          감지되어 저장되었을 때만 텔레그램 브리핑이 오도록 구성되어 있습니다.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-text">자동화 상태</h3>
        <div className="mt-3 space-y-2 text-sm text-text-muted">
          <p>• 자동화 이름: <strong className="text-text">Lawbot Legal Briefing</strong></p>
          <p>• 실행 기준: 매일 오전 9시 KST</p>
          <p>• 알림 조건: <strong className="text-text">created / updated_existing</strong> 결과가 있을 때만 전송</p>
          <p>• 변경이 없으면 텔레그램 알림은 오지 않습니다.</p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-text">법령 모니터링 대상</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {lawTargets.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-surface-muted p-4 text-sm text-text-muted">
            <p className="font-medium text-text">Lawbot 명령</p>
            <p className="mt-2">• 전체 점검: <code>/lawmonitor</code></p>
            <p>• 전체 저장: <code>/lawmonitor run</code></p>
            <p>• 개별 점검: <code>/lawmonitor 국적법</code></p>
            <p>• 개별 저장: <code>/lawsave 국적법</code></p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-text">판례 모니터링 대상</h3>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {precedentTargets.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-surface-muted p-4 text-sm text-text-muted">
            <p className="font-medium text-text">Lawbot 명령</p>
            <p className="mt-2">• 전체 점검: <code>/precmonitor</code></p>
            <p>• 전체 저장: <code>/precmonitor run</code></p>
            <p>• 개별 점검: <code>/precmonitor 출국명령</code></p>
            <p>• 개별 저장: <code>/precsave 출국명령</code></p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-text">웹페이지에서 나중에 붙일 항목</h3>
        <div className="mt-3 space-y-2 text-sm text-text-muted">
          <p>• 모니터링 대상 법령/검색어 추가 및 삭제</p>
          <p>• lookback 일수 조정</p>
          <p>• 수동 실행 버튼과 최근 실행 결과 표시</p>
          <p>• Telegram 브리핑 on/off</p>
          <p>• 최근 감지된 법령 변경 / 판례 카드 요약</p>
        </div>
      </Card>
    </div>
  );
}
