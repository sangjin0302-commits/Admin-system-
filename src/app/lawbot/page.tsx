import { headers } from "next/headers";

import { BotChatPanel } from "@/components/public/bot-chat-panel";
import { getBotTier } from "@/lib/services/bot-access-tier";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "법령 챗봇 — Lawbot",
  description: "행정 절차·법령을 안내하는 참고용 챗봇.",
};

export default async function LawbotPage() {
  const h = await headers();
  const request = new Request("http://internal/lawbot", { headers: h });
  const initialTier = await getBotTier(request);

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <section className="ethos-card p-6 sm:p-8">
          <p className="ui-kicker">LAWBOT</p>
          <h1 className="ethos-display mt-2 text-2xl sm:text-3xl">법령 챗봇 — Lawbot</h1>
          <p className="mt-2 text-sm text-text-muted">
            행정 절차, 인허가, 비자/체류 관련 법령에 대한 기본 안내를 받아보세요. 본 정보는 참고용이며
            법률 자문이 아닙니다.
          </p>
        </section>

        <section className="ethos-card p-6 sm:p-8">
          <BotChatPanel bot="lawbot" initialTier={initialTier} />
        </section>
      </main>
    </div>
  );
}
