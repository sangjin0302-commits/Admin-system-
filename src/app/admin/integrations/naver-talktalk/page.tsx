import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { NaverTalkTalkTestPanel } from "./test-panel";

export const dynamic = "force-dynamic";

export default function NaverTalkTalkPage() {
  const partnerId = process.env.NAVER_TALKTALK_PARTNER_ID;
  const tokenSet = !!process.env.NAVER_TALKTALK_TOKEN;

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        kicker="연동"
        title="네이버 톡톡"
        description="네이버 톡톡 비즈니스 채팅 채널 연동 설정 및 테스트"
      />
      <Card className="p-6">
        <h3 className="text-sm font-bold text-text-strong">현재 상태</h3>
        <ul className="mt-3 space-y-1 text-sm text-text-muted">
          <li>Partner ID: {partnerId ?? "(미설정)"}</li>
          <li>Token: {tokenSet ? "설정됨" : "미설정 — 모의 모드로 동작합니다"}</li>
        </ul>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-bold text-text-strong">설정 방법</h3>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text-muted">
          <li>네이버 톡톡 파트너센터에서 비즈니스 계정 생성</li>
          <li>챗봇 API 이용 신청 후 Partner ID와 Token 발급</li>
          <li>환경변수 <code>NAVER_TALKTALK_PARTNER_ID</code>, <code>NAVER_TALKTALK_TOKEN</code> 설정</li>
          <li>Webhook URL을 <code>/api/webhooks/naver-talktalk</code>로 등록</li>
        </ol>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-bold text-text-strong">전송 테스트</h3>
        <div className="mt-3">
          <NaverTalkTalkTestPanel />
        </div>
      </Card>
    </div>
  );
}
