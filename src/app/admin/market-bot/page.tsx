import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { MarketBotChat } from "./market-bot-chat";

export const dynamic = "force-dynamic";

export default function AdminMarketBotPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        kicker="AI Tools"
        title="마켓 분석 봇"
        description="관리자 전용 시장·경쟁사 분석 챗봇. 제한 없이 사용 가능합니다."
      />
      <Card className="p-6">
        <MarketBotChat />
      </Card>
    </div>
  );
}
