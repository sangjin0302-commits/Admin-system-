import { Card } from "@/components/ui/card";

import { listVariants } from "@/lib/services/homepage-personalization-service";

import { PersonalizationEditor } from "./personalization-editor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "홈페이지 맞춤화 — 관리자",
};

export default async function AdminPersonalizationPage() {
  const variants = await listVariants();
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="ui-kicker">Personalization</p>
        <h1 className="mt-2 ui-page-title">홈페이지 맞춤화</h1>
        <p className="mt-2 text-sm text-text-muted">
          방문자의 리퍼러 · UTM · 지역 · 디바이스에 따라 홈페이지 히어로 카피를 자동으로 변형합니다.
          가장 먼저 매칭된 variant가 적용됩니다.
        </p>
      </Card>
      <PersonalizationEditor initialVariants={variants} />
    </div>
  );
}
