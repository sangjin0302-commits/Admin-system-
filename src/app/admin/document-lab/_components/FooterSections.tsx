import { Card } from "@/components/ui/card";

export function FooterSections() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <p className="ui-kicker">안전 가드레일</p>
        <h3 className="mt-2 ui-section-title">안전 기준</h3>
        <ul className="mt-4 space-y-2 text-sm text-text-muted">
          <li>관리자 전용 화면입니다.</li>
          <li>읽기 전용 목록만 표시합니다.</li>
          <li>공식 서식 최신성 확인 필요.</li>
          <li>고위험 문서는 업무범위와 공식 서식 확인 후 별도 단계에서 다룹니다.</li>
          <li>고객 발송 없음, 기관 제출 없음, AI 단독 법률판단 없음.</li>
        </ul>
      </Card>

      <Card className="p-6">
        <p className="ui-kicker">다음 단계</p>
        <h3 className="mt-2 ui-section-title">다음 단계 후보</h3>
        <ol className="mt-4 space-y-2 text-sm text-text-muted">
          <li>1. 공식 HWP 원본 확보 상태를 별도 체크리스트로 관리.</li>
          <li>2. 샘플 데이터 기반 HWPX/DOCX/HTML 변환 실험.</li>
          <li>3. 미리보기 전용 입력란 렌더러 설계.</li>
          <li>4. 검증 후 CaseMatter 읽기 전용 연결 검토.</li>
        </ol>
      </Card>
    </div>
  );
}
