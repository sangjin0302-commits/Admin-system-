import type { Metadata } from "next";

import { COMMUNITY_CATEGORIES } from "@/lib/services/community-service";
import { CommunityAskForm } from "./ask-form";

export const metadata: Metadata = {
  title: "질문 남기기 | ETHOS 행정 Q&A",
  description: "비자·행정심판·계약·인허가 등 실무 관련 질문을 남기시면 행정사가 검토 후 답변드립니다.",
};

export const dynamic = "force-static";

export default function CommunityAskPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-8">
        <p className="ui-kicker">COMMUNITY</p>
        <h1 className="mt-2 text-3xl font-bold text-text-strong">질문 남기기</h1>
        <p className="mt-2 text-sm text-text-muted">
          질문은 검토 후 공개 아카이브(/community)로 답변합니다. 개인정보는 포함하지 말아주세요.
        </p>
      </header>

      <CommunityAskForm categories={COMMUNITY_CATEGORIES.slice()} />
    </main>
  );
}
